function buildVietQR({ bookingCode, amount }) {
  const bankId = process.env.VIETQR_BANK_ID || 'MB';
  const accountNo = process.env.VIETQR_ACCOUNT_NO || '0741236901122';
  const accountName = process.env.VIETQR_ACCOUNT_NAME || 'TRINH XUAN NAM';
  const template = process.env.VIETQR_TEMPLATE || 'compact2';
  const transferContent = `KINGBEEF ${bookingCode}`;

  const qrUrl =
    `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png` +
    `?amount=${amount}` +
    `&addInfo=${encodeURIComponent(transferContent)}` +
    `&accountName=${encodeURIComponent(accountName)}`;

  return {
    bankId,
    accountNo,
    accountName,
    amount,
    transferContent,
    qrUrl,
  };
}

module.exports = { buildVietQR };
