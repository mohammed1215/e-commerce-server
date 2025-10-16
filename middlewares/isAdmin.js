export const isAdmin = (req, res, next) => {
  if (req?.user?.role === 'MERCHANT') {
    next()
  } else {
    return res.sendStatus(403)
  }
}