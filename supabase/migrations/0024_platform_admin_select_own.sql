-- Control plane: o próprio admin lê a própria linha com JWT (anon).
-- Evita service_role no caminho crítico de login (/inicio → getPlatformSession).
-- Enumeração de outros admins continua bloqueada (só auth.uid() = auth_user_id).

create policy platform_admin_select_own
  on platform_admin
  for select
  to authenticated
  using (auth_user_id = auth.uid());
