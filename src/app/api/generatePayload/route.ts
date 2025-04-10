import { createHmac, randomBytes } from 'crypto';

// 假设有一个 HexUtil.encodeHexStr 函数或使用 Buffer.toString('hex') 来替代
function encodeHexStr(buffer: Buffer): string {
  return buffer.toString('hex');
}

function generatePayload() {
  const secret = process.env.SECRET!;
  const ttl = Number(process.env.TIME!);
  const hmac = createHmac('sha256', secret);

  // 生成随机字节
  const bytes = randomBytes(8);

  // 创建一个16字节的Buffer并填充随机字节
  const buffer = Buffer.alloc(16);
  bytes.copy(buffer, 0);

  // 获取当前时间（秒）并加上生存时间，然后将其写入Buffer的后8字节
  const time = Math.floor(Date.now() / 1000) + ttl;

  buffer.writeBigInt64BE(BigInt(time), 8);

  // 使用Buffer更新HMAC
  hmac.update(buffer);
  const hmacBytes = hmac.digest();

  // 创建最终的字节序列
  const finalBytes = Buffer.concat([buffer, hmacBytes.slice(0, 16)]);

  // 将结果转换为十六进制字符串
  return Response.json(
    {
      payload: encodeHexStr(finalBytes),
    },
    {
      status: 200,
    }
  );
}

export { generatePayload as POST };
