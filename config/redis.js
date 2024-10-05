const redis = require("redis");

const client = redis.createClient({
  password: "L3PcLPkXydHNGQrCBhv8g2JpltvTG6wP",
  socket: {
    host: "redis-14532.c305.ap-south-1-1.ec2.redns.redis-cloud.com",
    port: 14532,
  },
});


// Handle connection errors / client events
client.on("connect", function () {
  console.error("Redis connection established...");
});
client.on("error", (err) => {
  console.error("Redis Client Error:", err);
});



client.connect();


module.exports = client;