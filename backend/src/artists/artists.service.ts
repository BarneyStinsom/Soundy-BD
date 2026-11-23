import { Injectable, NotFoundException } from '@nestjs/common';
import { db, uuidv7 } from '../database/db.js';

@Injectable()
export class ArtistsService {
  async findAll() {
    return await db.many(`SELECT "id", "name", "coverUrl" FROM "Artist"`);
  }

  async findOne(id: string) {
    return await db.one(`SELECT * FROM "Artist" WHERE "id" = $1`, [id]);
  }

  async create(name: string, coverUrl?: string) {
    return await db.one(
      `INSERT INTO "Artist" ("id", "name", "coverUrl", "updatedAt")
       VALUES ($1, $2, $3, now())
       RETURNING *`,
      [uuidv7(), name, coverUrl ?? null],
    );
  }

  async update(id: string, name: string, coverUrl?: string) {
    const artist = await this.findOne(id);
    if (!artist) {
      throw new NotFoundException('Artista não encontrado');
    }
    return await db.one(
      `UPDATE "Artist"
       SET "name" = $2, "coverUrl" = $3, "updatedAt" = now()
       WHERE "id" = $1
       RETURNING *`,
      [id, name, coverUrl ?? artist.coverUrl],
    );
  }

  async delete(id: string) {
    const artist = await this.findOne(id);
    if (!artist) {
      throw new NotFoundException('Artista não encontrado');
    }
    return await db.one(`DELETE FROM "Artist" WHERE "id" = $1 RETURNING *`, [id]);
  }

  async findAlbums(id: string) {
    const artist = await this.findOne(id);
    if (!artist) {
      throw new NotFoundException('Artista não encontrado');
    }
    const albums = await db.many(
      `SELECT "id", "title", "type", "coverUrl" FROM "Album" WHERE "artistId" = $1`,
      [id],
    );
    if (albums.length === 0) {
      throw new NotFoundException('Álbum não encontrado');
    }
    return albums;
  }
}
