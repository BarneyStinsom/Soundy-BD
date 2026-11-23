import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { db, uuidv7 } from '../database/db.js';

@Injectable()
export class SongsService {
  async findAll() {
    return await db.many(
      `SELECT s."id", s."title", s."duration", s."songCoverUrl",
              json_build_object('name', ar."name") AS "artist"
       FROM "Song" s
       LEFT JOIN "Artist" ar ON ar."id" = s."artistId"`,
    );
  }

  async findOne(id: string) {
    const song = await db.one(
      `SELECT s."id", s."title", s."duration", s."songUrl", s."songCoverUrl",
              json_build_object('id', ar."id", 'name', ar."name") AS "artist",
              json_build_object('id', al."id", 'title', al."title",
                                'type', al."type", 'coverUrl', al."coverUrl") AS "album"
       FROM "Song" s
       LEFT JOIN "Artist" ar ON ar."id" = s."artistId"
       LEFT JOIN "Album"  al ON al."id" = s."albumId"
       WHERE s."id" = $1`,
      [id],
    );
    if (!song) throw new NotFoundException('Música não encontrada');
    return song;
  }

  /** Valida que artista e álbum existem e que o álbum pertence ao artista. */
  private async validateArtistAndAlbum(artistId: string, albumId: string) {
    const artist = await db.one(`SELECT 1 FROM "Artist" WHERE "id" = $1`, [artistId]);
    const album = await db.one(`SELECT "artistId" FROM "Album" WHERE "id" = $1`, [albumId]);
    if (!artist || !album) {
      throw new NotFoundException('Artista ou álbum não encontrado');
    }
    if (album.artistId !== artistId) {
      throw new BadRequestException('O álbum não pertence ao artista informado');
    }
  }

  async create(
    title: string,
    duration: number,
    songUrl: string,
    artistId: string,
    albumId: string,
    songCoverUrl?: string,
  ) {
    await this.validateArtistAndAlbum(artistId, albumId);
    return await db.one(
      `INSERT INTO "Song"
         ("id", "title", "duration", "songUrl", "artistId", "albumId", "songCoverUrl", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())
       RETURNING *`,
      [uuidv7(), title, duration, songUrl, artistId, albumId, songCoverUrl ?? null],
    );
  }

  async update(
    id: string,
    title: string,
    duration?: number,
    songUrl?: string,
    artistId?: string,
    albumId?: string,
    songCoverUrl?: string,
  ) {
    const song = await db.one(`SELECT * FROM "Song" WHERE "id" = $1`, [id]);
    if (!song) {
      throw new NotFoundException('Música não encontrada');
    }

    const finalArtistId = artistId ?? song.artistId;
    const finalAlbumId = albumId ?? song.albumId;

    if (artistId || albumId) {
      await this.validateArtistAndAlbum(finalArtistId, finalAlbumId);
    }

    return await db.one(
      `UPDATE "Song"
       SET "title" = $2, "duration" = $3, "songUrl" = $4, "artistId" = $5,
           "albumId" = $6, "songCoverUrl" = $7, "updatedAt" = now()
       WHERE "id" = $1
       RETURNING *`,
      [
        id,
        title,
        duration ?? song.duration,
        songUrl ?? song.songUrl,
        finalArtistId,
        finalAlbumId,
        songCoverUrl ?? song.songCoverUrl,
      ],
    );
  }

  async delete(id: string) {
    const song = await db.one(`SELECT 1 FROM "Song" WHERE "id" = $1`, [id]);
    if (!song) {
      throw new NotFoundException('Música não encontrada');
    }
    await db.many(`DELETE FROM "PlayHistory" WHERE "songId" = $1`, [id]);
    await db.many(`DELETE FROM "PlaylistSong" WHERE "songId" = $1`, [id]);
    return await db.one(`DELETE FROM "Song" WHERE "id" = $1 RETURNING *`, [id]);
  }

  /** Músicas mais tocadas: um único SQL com GROUP BY + JOIN (antes eram N+1 consultas). */
  async findTopSongs(limitCount = 10) {
    return await db.many(
      `SELECT ph."songId"                          AS "songId",
              COALESCE(s."title", 'Desconhecida')  AS "title",
              s."songCoverUrl"                     AS "songCoverUrl",
              COALESCE(ar."name", '')              AS "artistName",
              COUNT(*)::int                        AS "playCount"
       FROM "PlayHistory" ph
       LEFT JOIN "Song"   s  ON s."id"  = ph."songId"
       LEFT JOIN "Artist" ar ON ar."id" = s."artistId"
       GROUP BY ph."songId", s."title", s."songCoverUrl", ar."name"
       ORDER BY "playCount" DESC
       LIMIT $1`,
      [limitCount],
    );
  }
}
