function errorHandler(err, req, res, next) {
  console.error('[Server Error]', err);

  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'Dữ liệu đã tồn tại (trùng khóa duy nhất). Vui lòng kiểm tra lại.',
      detail: err.meta,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      message: 'Không tìm thấy dữ liệu yêu cầu.',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.',
  });
}

module.exports = errorHandler;
