/**
 * Formatea un número como dinero: $25,000.00
 * @param {number|string} value - Valor a formatear
 * @param {boolean} withSymbol - Si incluir el símbolo $ (default: true)
 * @returns {string} Valor formateado
 */
export function formatMoney(value, withSymbol = true) {
    const num = parseFloat(value) || 0;
    const formatted = num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return withSymbol ? `$${formatted}` : formatted;
}
