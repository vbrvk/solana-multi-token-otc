export const shortAddress = (address: string | undefined): string => {
  if (!address) return '???'
  return (
    address.substring(0, 4) +
    '...' +
    address.substring(address.length - 4, address.length)
  )
}