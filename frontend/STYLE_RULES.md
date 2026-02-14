# 🎨 NANLOMO Design System - Reglas de Estilo

## Principio Fundamental de Contraste

**REGLA #1 - CONTRASTE OBLIGATORIO:**
- Fondo OSCURO (negro, gris-700, gris-800, gris-900) → Texto CLARO (white, nanlomo-gold, nanlomo-gold-light)
- Fondo CLARO (blanco, amarillo, gold, nanlomo-gold) → Texto OSCURO (nanlomo-black, black, gray-900)

---

## Paleta de Colores NANLOMO

### Colores Principales
| Nombre | Código | Uso |
|--------|--------|-----|
| `nanlomo-black` | `#1a1a1a` | Fondos principales, cards |
| `nanlomo-gold` | `#FFD700` | Acentos, títulos, bordes |
| `nanlomo-gold-light` | `#FFC107` | Bordes secundarios, hover |
| `nanlomo-red` | `#DC2626` | Botones primarios, alertas |
| `nanlomo-red-dark` | `#991B1B` | Hover de botones rojos |
| `nanlomo-white` | `#FFFFFF` | Texto sobre fondos oscuros |

### Grises Permitidos
| Nombre | Uso |
|--------|-----|
| `gray-700` | Botones secundarios |
| `gray-800` | Inputs, cards internas |
| `gray-900` | Fondos alternativos oscuros |

---

## Reglas de Botones

### Variante PRIMARY (Acción Principal)
```
Fondo: bg-nanlomo-red
Texto: text-white ✅
Borde: ninguno
Hover: bg-nanlomo-red-dark, scale-105
```

### Variante SECONDARY (Acción Secundaria)
```
Fondo: bg-gray-700
Texto: text-white ✅
Borde: border-2 border-nanlomo-gold-light
Hover: bg-gray-600
```

### Variante SUCCESS
```
Fondo: bg-green-600
Texto: text-white ✅
Hover: bg-green-700
```

### Variante DANGER
```
Fondo: bg-red-700
Texto: text-white ✅
Hover: bg-red-800
```

### Variante WARNING
```
Fondo: bg-nanlomo-gold
Texto: text-nanlomo-black ✅ (fondo claro = texto oscuro)
Hover: bg-nanlomo-gold-light
```

### Variante OUTLINE
```
Fondo: transparente
Texto: text-nanlomo-gold
Borde: border-2 border-nanlomo-gold
Hover: bg-nanlomo-gold text-nanlomo-black
```

---

## Reglas de Inputs

```
Fondo: bg-gray-800
Texto: text-white ✅
Placeholder: placeholder-gray-400
Borde: border-2 border-nanlomo-gold-light
Focus: ring-nanlomo-gold
Label: text-nanlomo-gold font-bold
```

---

## Reglas de Cards

```
Fondo: bg-nanlomo-black
Borde: border-2 border-nanlomo-gold
Título: text-nanlomo-gold font-bold
Contenido: text-nanlomo-white
Sombra: shadow-2xl
```

---

## Reglas de Badges/Tags

### Sobre fondo oscuro
```
Fondo: bg-nanlomo-gold
Texto: text-nanlomo-black ✅
```

### Estados de pedidos
```
Pendiente: bg-yellow-500 text-black
Asignado: bg-blue-500 text-white
En Proceso: bg-purple-500 text-white
Completado: bg-green-500 text-white
```

---

## Reglas de Filtros/Tabs

### Estado ACTIVO
```
bg-[color]-500 text-white (o text-black si el color es claro como amarillo)
shadow-lg scale-105
```

### Estado INACTIVO
```
bg-gray-800 text-white border-2 border-[color]-400
hover:bg-gray-700
```

---

## ❌ NUNCA HACER

1. ❌ `bg-gray-800 text-gray-800` (invisible)
2. ❌ `bg-nanlomo-black text-nanlomo-black` (invisible)
3. ❌ `bg-white text-white` (invisible)
4. ❌ `bg-nanlomo-gold text-nanlomo-gold` (invisible)
5. ❌ Texto de color oscuro sobre fondo oscuro
6. ❌ Texto de color claro sobre fondo claro

---

## ✅ SIEMPRE VERIFICAR

Antes de aplicar estilos, verificar:
1. ¿El fondo es oscuro? → Usar texto blanco o gold
2. ¿El fondo es claro? → Usar texto negro
3. ¿Es un botón? → Seguir las variantes definidas arriba
4. ¿Es un input? → bg-gray-800, text-white, border-gold
5. ¿Es una card? → bg-nanlomo-black, border-gold, text-white/gold

---

## Tipografía

- **Títulos principales**: `font-nanlomo font-bold text-nanlomo-gold`
- **Subtítulos**: `font-bold text-nanlomo-gold-light`
- **Texto normal**: `text-nanlomo-white` o `text-white`
- **Texto secundario**: `text-gray-400`
- **Links**: `text-nanlomo-gold hover:text-nanlomo-gold-light`

---

## Iconos/Emojis Permitidos

- 🍔 Hamburguesa (logo, menú)
- 📋 Pedidos/Dashboard
- 👨‍🍳 Cocina
- 🔥 En proceso
- ✅ Completado
- ⏱️ Tiempo
- 💰 Dinero/Total
- 🛒 Carrito
- 🍽️ Items/Platos
- 📥 Solicitar
- 🔄 Actualizar
