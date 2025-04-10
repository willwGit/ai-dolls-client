import { TonProofItemReplySuccess } from '@tonconnect/protocol';
import { Wallet } from '@tonconnect/sdk';
import { Address } from 'ton';
import nacl from 'tweetnacl';
import { createHmac, timingSafeEqual, createHash } from 'crypto';

interface Domain {
  LengthBytes: number; // uint32 `json:"lengthBytes"`
  Value: string; // string `json:"value"`
}

interface ParsedMessage {
  Workchain: number; // int32
  Address: Buffer; // []byte
  Timstamp: number; // int64
  Domain: Domain; // Domain
  Signature: Buffer; // []byte
  Payload: string; // string
  StateInit: string; // string
}

export function SignatureVerify(
  pubkey: Buffer,
  message: Buffer,
  signature: Buffer
): boolean {
  return nacl.sign.detached.verify(message, signature, pubkey);

  // return ed25519.Verify(pubkey, message, signature)
}

const tonProofPrefix = 'ton-proof-item-v2/';
const tonConnectPrefix = 'ton-connect';

export async function CreateMessage(message: ParsedMessage): Promise<Buffer> {
  // wc := make([]byte, 4)
  // binary.BigEndian.PutUint32(wc, uint32(message.Workchain))

  const wc = Buffer.alloc(4);
  wc.writeUint32BE(message.Workchain);

  // ts := make([]byte, 8)
  // binary.LittleEndian.PutUint64(ts, uint64(message.Timstamp))

  const ts = Buffer.alloc(8);
  ts.writeBigUint64LE(BigInt(message.Timstamp));

  // dl := make([]byte, 4)
  // binary.LittleEndian.PutUint32(dl, message.Domain.LengthBytes)
  const dl = Buffer.alloc(4);
  dl.writeUint32LE(message.Domain.LengthBytes);

  const m = Buffer.concat([
    Buffer.from(tonProofPrefix),
    wc,
    message.Address,
    dl,
    Buffer.from(message.Domain.Value),
    ts,
    Buffer.from(message.Payload),
  ]);

  // const messageHash =  //sha256.Sum256(m)
  // const messageHash = await crypto.subtle.digest('SHA-256', m)
  // const m = Buffer.from(tonProofPrefix)
  // m.write(ts)

  // m := []byte(tonProofPrefix)
  // m = append(m, wc...)
  // m = append(m, message.Address...)
  // m = append(m, dl...)
  // m = append(m, []byte(message.Domain.Value)...)
  // m = append(m, ts...)
  // m = append(m, []byte(message.Payload)...)

  const messageHash = createHash('sha256').update(m).digest();

  const fullMes = Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from(tonConnectPrefix),
    Buffer.from(messageHash),
  ]);
  // []byte{0xff, 0xff}
  // fullMes = append(fullMes, []byte(tonConnectPrefix)...)
  // fullMes = append(fullMes, messageHash[:]...)

  // const res = await crypto.subtle.digest('SHA-256', fullMes)
  const res = createHash('sha256').update(fullMes).digest();
  return Buffer.from(res);
}

export type Body = {
  address: string;
  network: string;
  proof: TonProofItemReplySuccess['proof'] & {
    state_init: string;
  };
  extParams: Indexes;
};

export function ConvertTonProofMessage(
  body: Body,
  proof: Body['proof']
): ParsedMessage {
  const address = Address.parse(body.address);

  const res: ParsedMessage = {
    Workchain: address.workChain,
    Address: address.hash,
    Domain: {
      LengthBytes: proof.domain.lengthBytes,
      Value: proof.domain.value,
    },
    Signature: Buffer.from(proof.signature, 'base64'),
    Payload: proof.payload,
    StateInit: proof.state_init,
    Timstamp: proof.timestamp,
  };
  return res;
}

export function checkPayload(payload: string, secret: string): Error | null {
  let b: Buffer;
  try {
    // 解码十六进制字符串
    b = Buffer.from(payload, 'hex');
  } catch (err) {
    return new Error('Failed to decode hex string');
  }

  if (b.length !== 32) {
    return new Error('Invalid payload length');
  }

  const hmac = createHmac('sha256', secret);

  hmac.update(b.slice(0, 16)); // 前 16 字节用于生成签名
  const sign = hmac.digest();

  // 使用 timingSafeEqual 比较以避免时序攻击
  if (!timingSafeEqual(b.slice(16), sign.slice(0, 16))) {
    return new Error('Invalid payload signature');
  }

  // 解析时间并判断是否过期
  const timestamp = b.readUInt32BE(8) * 1000 + b.readUInt32BE(12);

  if (Date.now() / 1000 - timestamp > 0) {
    return new Error('Payload expired');
  }

  return null;
}
