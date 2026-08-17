# Autenticacion

## Endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/logout`

## Credenciales iniciales

Para cuentas importadas:

```text
usuario inicial = cedula
contrasena temporal = cedula
```

La contrasena se almacena con `crypto.scrypt`, salt aleatorio por usuario y comparacion `timingSafeEqual`.

## Sesion

Cookie:

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- `Secure` en produccion/HTTPS

## Politica de nueva contrasena

- minimo 8 caracteres
- no igual a la cedula
- no igual a la contrasena anterior
- confirmacion obligatoria

## Variables requeridas para produccion

- `APP_SESSION_SECRET`
- `PASSWORD_HASH_PEPPER`
- `NODE_ENV=production`

## Compatibilidad admin

Se conserva temporalmente:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `x-admin-token`

El backend tambien acepta sesion con `role=admin` cuando exista una cuenta admin en `user_accounts`.

