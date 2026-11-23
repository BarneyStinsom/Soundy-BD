import { Injectable, NotFoundException } from '@nestjs/common';
import { db, uuidv7 } from '../database/db.js';

@Injectable()
export class PlaylistService {
  async findAll() {
    return await db.many(
      `SELECT p."id", p."name", p."isPublic",
              json_build_object('name', u."name") AS "user"
       FROM "Playlist" p
       LEFT JOIN "User" u ON u."id" = p."userId"`,
    );
  }

  async findSongs(id: string) {
    const playlist = await db.one(`SELECT 1 FROM "Playlist" WHERE "id" = $1`, [id]);
    if (!playlist) {
      throw new NotFoundException('Playlist não encontrada');
    }
    const rows = await db.many(
      `SELECT ps."id", ps."position",
              json_build_object('name', p."name") AS "playlist",
              json_build_object('id', s."id", 'title', s."title",
                                'duration', s."duration",
                                'songCoverUrl', s."songCoverUrl") AS "song"
       FROM "PlaylistSong" ps
       LEFT JOIN "Playlist" p ON p."id" = ps."playlistId"
       LEFT JOIN "Song"     s ON s."id" = ps."songId"
       WHERE ps."playlistId" = $1`,
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Nenhuma música encontrada para esta playlist');
    }
    return rows;
  }

  async create(name: string, userId: string, isPublic: boolean, coverUrl?: string) {
    const user = await db.one(`SELECT 1 FROM "User" WHERE "id" = $1`, [userId]);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return await db.one(
      `INSERT INTO "Playlist" ("id", "name", "userId", "coverUrl", "isPublic", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [uuidv7(), name, userId, coverUrl ?? null, isPublic],
    );
  }

  async update(id: string, name: string) {
    const playlist = await db.one(`SELECT 1 FROM "Playlist" WHERE "id" = $1`, [id]);
    if (!playlist) {
      throw new NotFoundException('Playlist não encontrada');
    }
    return await db.one(
      `UPDATE "Playlist" SET "name" = $2, "updatedAt" = now()
       WHERE "id" = $1 RETURNING *`,
      [id, name],
    );
  }

  async delete(id: string) {
    const playlist = await db.one(`SELECT 1 FROM "Playlist" WHERE "id" = $1`, [id]);
    if (!playlist) {
      throw new NotFoundException('Playlist não encontrada');
    }
    return await db.one(`DELETE FROM "Playlist" WHERE "id" = $1 RETURNING *`, [id]);
  }
}
