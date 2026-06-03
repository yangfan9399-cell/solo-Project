export function parseFields(fields, allowedFields) {
  if (!fields) return null
  const fieldList = fields.split(',')
  return fieldList.filter(f => allowedFields.includes(f))
}

export function buildWhereClause(filters, allowedFilters) {
  const conditions = []
  const values = {}
  
  Object.entries(filters).forEach(([key, value]) => {
    if (!allowedFilters.includes(key) || value === undefined || value === null || value === '') {
      return
    }
    
    if (key.endsWith('_like')) {
      const field = key.replace('_like', '')
      conditions.push(`${field} LIKE @${key}`)
      values[`@${key}`] = `%${value}%`
    } else if (key.endsWith('_gte')) {
      const field = key.replace('_gte', '')
      conditions.push(`${field} >= @${key}`)
      values[`@${key}`] = value
    } else if (key.endsWith('_lte')) {
      const field = key.replace('_lte', '')
      conditions.push(`${field} <= @${key}`)
      values[`@${key}`] = value
    } else if (Array.isArray(value)) {
      const placeholders = value.map((_, i) => `@${key}_${i}`).join(', ')
      conditions.push(`${key} IN (${placeholders})`)
      value.forEach((v, i) => {
        values[`@${key}_${i}`] = v
      })
    } else {
      conditions.push(`${key} = @${key}`)
      values[`@${key}`] = value
    }
  })
  
  return { conditions, values }
}

export function buildOrderBy(sort, allowedSorts) {
  if (!sort) return 'id DESC'
  
  const sortParts = sort.split(',')
  const orderParts = []
  
  for (const part of sortParts) {
    const [field, direction = 'ASC'] = part.split(':')
    if (allowedSorts.includes(field)) {
      orderParts.push(`${field} ${direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`)
    }
  }
  
  return orderParts.length > 0 ? orderParts.join(', ') : 'id DESC'
}

export function paginate(query, page = 1, pageSize = 20) {
  const offset = (page - 1) * pageSize
  return `${query} LIMIT @limit OFFSET @offset`
}
