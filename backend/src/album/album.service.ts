import { Injectable, NotFoundException } from '@nestjs/common';
import { db, uuidv7 } from '../database/db.js';

@Injectable()
export class AlbumsService {
  async findAll() {
    return await db.many(
      `SELECT a."id", a."title", a."type", a."artistId", a."coverUrl",
              json_build_object('name', ar."name") AS "artist"
       FROM "Album" a
       LEFT JOIN "Artist" ar ON ar."id" = a."artistId"`,
    );
  }

  async findOne(id: string) {
    return await db.one(
      `SELECT a."id", a."title", a."type", a."coverUrl",
              json_build_object('name', ar."name") AS "artist"
       FROM "Album" a
       LEFT JOIN "Artist" ar ON ar."id" = a."artistId"
       WHERE a."id" = $1`,
      [id],
    );
  }

  private async findRaw(id: string) {
    return await db.one(`SELECT * FROM "Album" WHERE "id" = $1`, [id]);
  }

  private async artistExists(id: string) {
    return !!(await db.one(`SELECT 1 FROM "Artist" WHERE "id" = $1`, [id]));
  }

  async create(title: string, type: string, artistId: string, coverUrl?: string) {
    if (!(await this.artistExists(artistId))) {
      throw new NotFoundException('Artista não encontrado');
    }
    return await db.one(
      `INSERT INTO "Album" ("id", "title", "type", "artistId", "coverUrl", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [uuidv7(), title, type, artistId, coverUrl ?? null],
    );
  }

  async update(id: string, title: string, type: string, artistId?: string, coverUrl?: string) {
    const album = await this.findRaw(id);
    if (!album) {
      throw new NotFoundException('Álbum não encontrado');
    }
    if (artistId && !(await this.artistExists(artistId))) {
      throw new NotFoundException('Artista não encontrado');
    }
    return await db.one(
      `UPDATE "Album"
       SET "title" = $2, "type" = $3, "artistId" = $4, "coverUrl" = $5, "updatedAt" = now()
       WHERE "id" = $1
       RETURNING *`,
      [id, title, type, artistId ?? album.artistId, coverUrl ?? album.coverUrl],
    );
  }

  async delete(id: string) {
    const album = await this.findRaw(id);
    if (!album) {
      throw new NotFoundException('Álbum não encontrado');
    }
    return await db.one(`DELETE FROM "Album" WHERE "id" = $1 RETURNING *`, [id]);
  }

  async findSongs(id: string) {
    const album = await this.findRaw(id);
    if (!album) {
      throw new NotFoundException('Álbum não encontrado');
    }
    const songs = await db.many(
      `SELECT "id", "title", "duration", "songCoverUrl" FROM "Song" WHERE "albumId" = $1`,
      [id],
    );
    if (songs.length === 0) {
      throw new NotFoundException('Nenhuma música encontrada para este álbum');
    }
    return songs;
  }
}
