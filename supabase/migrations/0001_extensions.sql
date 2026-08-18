-- Extensões necessárias para os invariantes do CLAUDE.md:
-- gen_random_uuid() para PKs, btree_gist para EXCLUDE de vigência sobreposta.
create extension if not exists pgcrypto;
create extension if not exists btree_gist;
