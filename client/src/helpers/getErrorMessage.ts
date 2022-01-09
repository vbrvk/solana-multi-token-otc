const getErrorMessage = (error?: any) => {
  if (!error) {
    return 'Unknown error'
  }

  if (error.message) {
    return error.message
  }

  if (error.code) {
    return error.code
  }

  if (error.error) {
    return error.error
  }

  return JSON.stringify(error)
}

export default getErrorMessage
