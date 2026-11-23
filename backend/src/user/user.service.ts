import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { db, uuidv7 } from '../database/db.js';

@Injectable()
export class UserService {
  async findAll() {
    return await db.many(`SELECT "id", "name", "email", "password" FROM "User"`);
  }

  async findOne(id: string) {
    const user = await db.one(
      `SELECT "id", "name", "email", "pictureUrl" FROM "User" WHERE "id" = $1`,
      [id],
    );
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  private async findRaw(id: string) {
    const user = await db.one(`SELECT * FROM "User" WHERE "id" = $1`, [id]);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findPlaylists(id: string) {
    await this.findRaw(id);
    return await db.many(
      `SELECT "id", "name", "coverUrl" FROM "Playlist" WHERE "userId" = $1`,
      [id],
    );
  }

  async create(name: string, email: string, password: string, isAdmin: boolean, pictureUrl?: string) {
    const existing = await db.one(`SELECT 1 FROM "User" WHERE "email" = $1`, [email]);
    if (existing) {
      throw new ConflictException('Já existe uma conta com esse email.');
    }
    return await db.one(
      `INSERT INTO "User" ("id", "name", "email", "password", "isAdmin", "pictureUrl", "updatedAt")
       VALUES ($1, $2, $3, $4, COALESCE($5, false), $6, now())
       RETURNING *`,
      [uuidv7(), name, email, password, isAdmin ?? null, pictureUrl ?? null],
    );
  }

  async update(
    id: string,
    name: string,
    email: string,
    password: string,
    isAdmin: boolean | undefined,
    pictureUrl: string | undefined,
  ) {
    const user = await this.findRaw(id);
    return await db.one(
      `UPDATE "User"
       SET "name" = $2, "email" = $3, "password" = $4, "isAdmin" = $5,
           "pictureUrl" = $6, "updatedAt" = now()
       WHERE "id" = $1
       RETURNING *`,
      [id, name, email, password, isAdmin ?? user.isAdmin, pictureUrl ?? user.pictureUrl],
    );
  }

  async delete(id: string) {
    await this.findRaw(id);
    return await db.one(`DELETE FROM "User" WHERE "id" = $1 RETURNING *`, [id]);
  }

  async login(email: string, password: string) {
    const user = await db.one(`SELECT * FROM "User" WHERE "email" = $1`, [email]);
    if (!user || user.password !== password) {
      throw new NotFoundException('Email ou senha incorretos');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    };
  }

  async UpdaPic(id: string, pictureUrl: string) {
    await this.findRaw(id);
    return await db.one(
      `UPDATE "User" SET "pictureUrl" = $2, "updatedAt" = now()
       WHERE "id" = $1 RETURNING *`,
      [id, pictureUrl],
    );
  }
}
