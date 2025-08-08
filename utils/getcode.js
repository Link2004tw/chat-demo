const key = crypto.getRandomValues(new Uint8Array(32));
console.log(Buffer.from(key).toString("base64"));
