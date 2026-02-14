const { handleIncomingMessage } = require("../services/whatsapp.service");

const receiveMessage = async (req, res) => {
  try {
    const from = req.body.From.replace("whatsapp:+", "");
    const message = req.body.Body;

    const reply = await handleIncomingMessage(from, message);

    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>${reply}</Message>
      </Response>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

module.exports = { receiveMessage };
