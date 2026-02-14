# PR Preview Workflow (Deshabilitado Temporalmente)

## ¿Por qué está deshabilitado?

El workflow `pr-preview.yml` requiere permisos adicionales a nivel de repositorio en GitHub que no están habilitados por defecto. El error era:

```
Resource not accessible by integration (403)
```

## Cómo habilitarlo

### Opción 1: Configurar Permisos del Repositorio (Recomendado)

1. Ve a tu repositorio en GitHub.com
2. Click en **Settings** (⚙️)
3. En el menú izquierdo, click en **Actions** → **General**
4. Baja hasta la sección **Workflow permissions**
5. Selecciona: **Read and write permissions**
6. Marca: ✅ **Allow GitHub Actions to create and approve pull requests**
7. Click **Save**

### Opción 2: Renombrar el Archivo

Una vez configurados los permisos:

```bash
# Habilitar el workflow
mv .github/workflows/pr-preview.yml.disabled .github/workflows/pr-preview.yml

# Commit y push
git add .github/workflows/pr-preview.yml
git commit -m "chore: habilitar workflow pr-preview"
git push
```

## ¿Qué hace este workflow?

Cuando se crea o actualiza un Pull Request, el workflow:
- ✅ Instala dependencias del frontend
- ✅ Hace build del proyecto
- ✅ Calcula tamaño del build y tiempo
- 💬 Crea comentario automático en el PR con resumen

**Es opcional** - el flujo principal de CI/CD funciona sin él.

## Alternativa Simple

Si no quieres configurar permisos, simplemente deja el workflow deshabilitado. El flujo de trabajo será:

1. Ver cambios en PR → Files changed tab
2. Ver CI checks → Checks tab (tests, lint)
3. Merge desde móvil → Dispara deploy automático

Todo lo importante funciona sin el PR preview. 🚀
