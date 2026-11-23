import { Injectable, NotFoundException } from '@nestjs/common';
import { db, uuidv7 } from '../database/db.js';

@Injectable()
export class PlaylistsongsService {
  async findAll() {
    return await db.many(
      `SELECT ps."id", ps."position",
              json_build_object('name', p."name")   AS "playlist",
              json_build_object('title', s."title") AS "song"
       FROM "PlaylistSong" ps
       LEFT JOIN "Playlist" p ON p."id" = ps."playlistId"
       LEFT JOIN "Song"     s ON s."id" = ps."songId"`,
    );
  }

  async create(playlistId: string, songId: string, position: number) {
    const song = await db.one(`SELECT 1 FROM "Song" WHERE "id" = $1`, [songId]);
    const playlist = await db.one(`SELECT 1 FROM "Playlist" WHERE "id" = $1`, [playlistId]);
    if (!song || !playlist) {
      throw new NotFoundException('Música ou playlist não encontrada');
    }
    return await db.one(
      `INSERT INTO "PlaylistSong" ("id", "playlistId", "songId", "position", "updatedAt")
       VALUES ($1, $2, $3, $4, now())
       RETURNING *`,
      [uuidv7(), playlistId, songId, position],
    );
  }

  private async assertExists(id: string) {
    const row = await db.one(`SELECT 1 FROM "PlaylistSong" WHERE "id" = $1`, [id]);
    if (!row) {
      throw new NotFoundException('Música da playlist não encontrada');
    }
  }

  async update(id: string, position: number) {
    await this.assertExists(id);
    return await db.one(
      `UPDATE "PlaylistSong" SET "position" = $2, "updatedAt" = now()
       WHERE "id" = $1 RETURNING *`,
      [id, position],
    );
  }

  async delete(id: string) {
    await this.assertExists(id);
    return await db.one(`DELETE FROM "PlaylistSong" WHERE "id" = $1 RETURNING *`, [id]);
  }
}
