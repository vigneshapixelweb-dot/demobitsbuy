export type DepositNetwork = {
  id: string;
  name: string;
  address: string;
  minimumDeposit: string;
  fee: string;
};

export type DepositAsset = {
  id: string;
  symbol: string;
  name: string;
  badgeColor: string;
  networks: DepositNetwork[];
};

export const DEPOSIT_ASSETS: DepositAsset[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    badgeColor: "#F7931A",
    networks: [
      {
        id: "btc-mainnet",
        name: "Bitcoin",
        
        address: "4ff6re2484fs8eFD5fsS458s2wca",
        minimumDeposit: "0.00000 BTC",
        fee: "0.00000 BTC",
      },
      {
        id: "btc-bep20",
        name: "BEP20",
        address: "bc1q2w3e4r5t6y7u8i9o0pbtcbe",
        minimumDeposit: "0.00020 BTC",
        fee: "0.00010 BTC",
      },
    ],
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    badgeColor: "#627EEA",
    networks: [
      {
        id: "eth-mainnet",
        name: "Ethereum",
        address: "0x94A2f6a3E54fcF7b1D5cF0bAA03e8177",
        minimumDeposit: "0.00100 ETH",
        fee: "0.00050 ETH",
      },
      {
        id: "eth-arbitrum",
        name: "Arbitrum",
        address: "0xA95Bc7eD22af801e9234cD7A91AcCE23",
        minimumDeposit: "0.00100 ETH",
        fee: "0.00020 ETH",
      },
    ],
  },
  {
    id: "sol",
    symbol: "SOL",
    name: "Solana",
    badgeColor: "#1C1E24",
    networks: [
      {
        id: "sol-mainnet",
        name: "Solana",
        address: "6xq0zQfVTn2yxv8P8iQop95mXa7e4s71",
        minimumDeposit: "0.01000 SOL",
        fee: "0.00100 SOL",
      },
    ],
  },
];

export const DEPOSIT_NOTE =
  "Deposit may take from a few minutes to over 30 minutes.";
