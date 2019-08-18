const errorHandler = (err, req, res, next) => {
  if (err.isBoom) {
    res.status(err.output.statusCode).json({error: err.message})
  } else {
    res.status(500).json({error: 'internal server error'})
  }
  return
  // next(err)
}
module.exports = errorHandler