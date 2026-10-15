import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autorizado. Se requiere iniciar sesión.' });
      return;
    }

    const { role } = req.user;

    // Admin técnico tiene acceso general a todas las rutas protegidas
    if (role === 'admin' || allowedRoles.includes(role)) {
      next();
      return;
    }

    res.status(403).json({
      error: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`,
      userRole: role,
    });
  };
}
