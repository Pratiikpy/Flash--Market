import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MarketCard } from './components/MarketCard';
import { CreateMarketModal } from './components/CreateMarketModal';
import { client, GET_ALL_MARKETS, PLACE_BET, GET_CHAINS, CREATE_MARKET, CHAIN_ID } from './lib/graphql';
import { Plus } from 'lucide-react';

// Types based on GraphQL response
interface Market {
  id: string;
  question: string;
  closesAt: number;
  totalPool: number;
  upPool: number;
  downPool: number;
  status: 'Open' | 'Locked' | 'Resolved' | 'Cancelled';
}

function App() {
  const [balance, setBalance] = useState(0);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [owner, setOwner] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch initial chain/owner info
  useEffect(() => {
    const fetchChainInfo = async () => {
      try {
        const data: any = await client.request(GET_CHAINS);
        console.log('Backend connected! Next Market ID:', data.nextMarketId);
        setChainId(CHAIN_ID);
        setOwner(`User:${CHAIN_ID}`);
      } catch (error) {
        console.error('Failed to connect to backend:', error);
      }
    };
    fetchChainInfo();
  }, []);

  // Poll for markets and balance
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Markets
        const marketsData: any = await client.request(GET_ALL_MARKETS);
        console.log('Markets data:', marketsData);

        // Check if we have entries
        if (marketsData.markets && marketsData.markets.entries) {
          const parsedMarkets = marketsData.markets.entries.map((entry: any) => {
            const m = entry.value;
            let question = "Market #" + entry.key;

            // Try to extract question from marketType (camelCase)
            if (m.marketType) {
              if (m.marketType.BinaryEvent) {
                question = m.marketType.BinaryEvent.question;
              } else if (m.marketType.PricePrediction) {
                question = `Will ${m.marketType.PricePrediction.symbol} > ${m.marketType.PricePrediction.target_price}?`;
              } else if (m.marketType.Custom) {
                question = m.marketType.Custom.description;
              }
            }

            return {
              id: entry.key,
              question,
              closesAt: parseInt(m.closesAt || 0) / 1000, // micros to millis
              totalPool: parseInt(m.totalPool || 0),
              upPool: parseInt(m.upPool || 0),
              downPool: parseInt(m.downPool || 0),
              status: m.status || 'Open',
            };
          });
          setMarkets(parsedMarkets);
        } else {
          // No markets yet
          setMarkets([]);
        }

        // For demo: set a mock balance
        setBalance(1000000); // 1 token
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [owner]);

  const handleBet = async (marketId: string, amount: number, prediction: 'Up' | 'Down') => {
    try {
      await client.request(PLACE_BET, {
        marketId: parseInt(marketId),
        prediction,
        amount: amount.toString(),
      });
      alert('Bet placed successfully!');
    } catch (error) {
      console.error('Failed to place bet:', error);
      alert('Failed to place bet. See console for details.');
    }
  };

  const handleCreateMarket = async (type: 'Binary' | 'Price', details: any, duration: number) => {
    try {
      let marketType;
      if (type === 'Binary') {
        marketType = { BinaryEvent: { question: details.question } };
      } else {
        marketType = { PricePrediction: { symbol: details.symbol, target_price: details.targetPrice } };
      }

      await client.request(CREATE_MARKET, {
        marketType,
        durationMinutes: duration,
      });
      alert('Market created successfully!');
    } catch (error) {
      console.error('Failed to create market:', error);
      alert('Failed to create market. See console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header balance={balance} address={owner || "Connecting..."} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Explore Markets
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Predict outcomes and win rewards on the fastest prediction market.
            </p>
            {!owner && (
              <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                Connecting to local Linera node... Make sure `linera service` is running on port 8080.
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-5 h-5" />
            Create Market
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map(market => (
            <MarketCard
              key={market.id}
              {...market}
              onBet={(amount, prediction) => handleBet(market.id, amount, prediction)}
            />
          ))}
          {markets.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No active markets found. Create one to get started!
            </div>
          )}
        </div>
      </main>

      <CreateMarketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateMarket}
      />
    </div>
  );
}

export default App;

