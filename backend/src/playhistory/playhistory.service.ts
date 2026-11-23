import { Injectable, NotFoundException } from '@nestjs/common';
import { db, uuidv7 } from '../database/db.js';

@Injectable()
export class PlayHistoryService {
  async findAll() {
    return await db.many(
      `SELECT ph."id", ph."userId", ph."songId", ph."playedAt",
              json_build_object('name', u."name")  AS "user",
              json_build_object('title', s."title") AS "song"
       FROM "PlayHistory" ph
       LEFT JOIN "User" u ON u."id" = ph."userId"
       LEFT JOIN "Song" s ON s."id" = ph."songId"`,
    );
  }

  async create(userId: string, songId: string, playedAt: string) {
    const user = await db.one(`SELECT 1 FROM "User" WHERE "id" = $1`, [userId]);
    const song = await db.one(`SELECT 1 FROM "Song" WHERE "id" = $1`, [songId]);
    if (!user || !song) {
      throw new NotFoundException('Usuário ou música não encontrados');
    }
    return await db.one(
      `INSERT INTO "PlayHistory" ("id", "userId", "songId", "playedAt")
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uuidv7(), userId, songId, playedAt],
    );
  }

  async delete(id: string) {
    const playHistory = await db.one(`SELECT 1 FROM "PlayHistory" WHERE "id" = $1`, [id]);
    if (!playHistory) {
      throw new NotFoundException('Histórico de reprodução não encontrado');
    }
    return await db.one(`DELETE FROM "PlayHistory" WHERE "id" = $1 RETURNING *`, [id]);
  }
}
