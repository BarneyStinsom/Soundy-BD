
CREATE TABLE IF NOT EXISTS "User" (
  "id"         CHAR(36)    PRIMARY KEY,
  "isAdmin"    BOOLEAN     NOT NULL DEFAULT false,
  "name"       TEXT        NOT NULL,
  "email"      TEXT        NOT NULL,
  "pictureUrl" TEXT,
  "password"   TEXT        NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Artist" (
  "id"        CHAR(36)    PRIMARY KEY,
  "name"      TEXT        NOT NULL,
  "coverUrl"  TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Album" (
  "id"        CHAR(36)    PRIMARY KEY,
  "title"     TEXT        NOT NULL,
  "type"      TEXT        NOT NULL,
  "coverUrl"  TEXT,
  "artistId"  CHAR(36)    NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Song" (
  "id"           CHAR(36)    PRIMARY KEY,
  "title"        TEXT        NOT NULL,
  "duration"     INTEGER     NOT NULL,
  "songUrl"      TEXT        NOT NULL,
  "songCoverUrl" TEXT,
  "artistId"     CHAR(36)    NOT NULL,
  "albumId"      CHAR(36)    NOT NULL,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Playlist" (
  "id"          CHAR(36)    PRIMARY KEY,
  "name"        TEXT        NOT NULL,
  "userId"      CHAR(36)    NOT NULL,
  "coverUrl"    TEXT,
  "isPublic"    BOOLEAN     NOT NULL,
  "description" TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PlaylistSong" (
  "id"         CHAR(36)    PRIMARY KEY,
  "playlistId" CHAR(36)    NOT NULL,
  "songId"     CHAR(36)    NOT NULL,
  "position"   INTEGER     NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PlayHistory" (
  "id"       CHAR(36)    PRIMARY KEY,
  "userId"   CHAR(36)    NOT NULL,
  "songId"   CHAR(36)    NOT NULL,
  "playedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
