# 📱 Workflow con GitHub Mobile

## 🚀 Configuración Inicial

### 1. Instalar GitHub Mobile
- 📱 **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=com.github.android)
- 🍎 **iOS**: [App Store](https://apps.apple.com/app/github/id1477376905)

### 2. Configurar Notificaciones
1. Abre GitHub Mobile
2. Ve a **Settings** → **Notifications**
3. Activa:
   - ✅ Pull Requests
   - ✅ Reviews requested
   - ✅ Workflow runs
   - ✅ Deployments

---

## 🔄 Flujo de Trabajo

### Opción 1: Desde la Computadora

```bash
# 1. Crear nueva rama para tu feature
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios y commits
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 3. Subir rama
git push origin feature/nueva-funcionalidad

# 4. Crear PR desde terminal
gh pr create --title "Nueva funcionalidad" --body "Descripción detallada"
```

### Opción 2: Desde GitHub Mobile

1. 📱 Abre GitHub Mobile
2. 🔔 Recibirás notificación del nuevo PR
3. 👀 Revisa los cambios (diff view)
4. ✅ Aprueba o comenta
5. 🔀 Merge desde el móvil

---

## 🤖 Automatizaciones Configuradas

### ✅ CI - Tests Automáticos
**Trigger**: Cada push a PR
- Ejecuta tests de backend
- Ejecuta tests de frontend
- Verifica linting
- **Ver en mobile**: GitHub Actions tab

### 🚀 CD - Deploy Automático
**Trigger**: Merge a `main`
- Build de producción
- Deploy automático
- Health checks
- **Ver en mobile**: Environments tab

### 🔍 PR Preview
**Trigger**: Nuevo PR
- Genera preview del build
- Comenta en el PR
- Muestra estadísticas
- **Ver en mobile**: Comentarios del bot

---

## 📋 Comandos Útiles desde Terminal

### Crear PR
```bash
gh pr create --base main --head feature/mi-feature
```

### Ver PRs abiertos
```bash
gh pr list
```

### Hacer merge desde terminal
```bash
gh pr merge 123 --squash
```

### Ver status de Actions
```bash
gh run list
```

### Deploy manual
```bash
gh workflow run deploy.yml
```

---

## 🎯 Flujo Completo de Ejemplo

### Día a día:

1. **Mañana** 🌅
   ```bash
   git checkout -b feature/menu-precios
   # Haces cambios...
   git commit -m "feat: actualizar precios del menú"
   git push origin feature/menu-precios
   gh pr create
   ```

2. **Durante el día** 📱
   - Recibes notificación en GitHub Mobile
   - Revisas cambios desde el móvil
   - CI/CD corre automáticamente
   - Ves tests passing ✅

3. **Tarde** 🌆
   - Apruebas PR desde el móvil
   - Haces merge con un tap
   - Deploy automático comienza
   - Recibes notificación cuando está live

4. **Verificación** ✅
   - App actualizada en producción
   - Health checks pasando
   - Todo desde tu móvil 📱

---

## 🔒 Branch Protection (Recomendado)

Para activar protección en `main`:

```bash
# Desde terminal
gh api repos/LSCANDRES/nano-lomos-restaurant/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_pull_request_reviews[required_approving_review_count]=1
```

O desde GitHub:
1. Settings → Branches
2. Add rule para `main`
3. Activar:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require conversation resolution

---

## 📱 Features de GitHub Mobile

### Ver desde el móvil:
- 📊 **Dashboard**: Resumen de actividad
- 🔔 **Notifications**: Alertas en tiempo real
- 🔍 **Pull Requests**: Review completo con diff
- 🤖 **Actions**: Ver workflows corriendo
- 🚀 **Environments**: Estado de producción
- 💬 **Comments**: Comentar y aprobar
- ✅ **Merge**: Hacer merge con un tap
- 📈 **Insights**: Gráficos y estadísticas

### Acciones rápidas:
- Aprobar PR: Swipe → Approve
- Comentar: Tap en línea de código
- Merge: Tap en botón verde
- Ver logs: GitHub Actions tab
- Deploy manual: Actions → Run workflow

---

## 🎨 Personalización

### Agregar más automatizaciones:

1. **Notificaciones Discord/Slack**
2. **Deploy a staging automático**
3. **Tests de integración**
4. **Lighthouse CI (performance)**
5. **Security scans**
6. **Backup antes de deploy**

---

## 🆘 Troubleshooting

### No recibo notificaciones
- Verifica permisos de notificaciones en el móvil
- Chequea Settings → Notifications en GitHub Mobile

### Actions fallan
- Revisa logs en GitHub Actions tab
- Verifica secrets estén configurados

### Deploy no funciona
- Chequea Environment secrets
- Verifica workflow permissions

---

## 📚 Recursos

- [GitHub Mobile Docs](https://docs.github.com/en/mobile)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)

---

**🎉 Con este setup, manejas todo el ciclo de desarrollo desde tu móvil!**
