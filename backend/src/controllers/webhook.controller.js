export const handleWebhook = async (req, res) => {
  console.log(`Webhook ID: ${req.params.id}`);
  console.log(`Method: ${req.method}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.sendStatus(200);
};