
import React from 'react';
import { CryptoPrice } from '../types';

interface PriceCardProps {
  price: CryptoPrice;
  onCreateAlert?: (symbol: string) => void;
}

const PriceCard: React.FC<PriceCardProps> = ({ price, onCreateAlert }) => {
  const isPositive = price.price_change_percentage_24h >= 0;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    return `${value.toLocaleString()}`;
  };

  return (
    <div className="price-card">
      <div className="price-card-header">
        <div className="coin-avatar">
          {price.symbol.toUpperCase().slice(0, 3)}
        </div>
        <div className="coin-info">
          <div className="coin-name">{price.name}</div>
          <div className="coin-price">{formatPrice(price.current_price)}</div>
        </div>
        <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '▲' : '▼'}
          {Math.abs(price.price_change_percentage_24h).toFixed(2)}%
        </div>
      </div>
      
      <div className="price-stats">
        <div>
          <div className="stat-label">Market Cap</div>
          <div className="stat-value">{formatMarketCap(price.market_cap)}</div>
        </div>
        <div>
          <div className="stat-label">24h Volume</div>
          <div className="stat-value">{formatMarketCap(price.total_volume)}</div>
        </div>
      </div>
      
      {onCreateAlert && (
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => onCreateAlert(price.symbol)}
            className="btn btn-primary btn-full"
          >
            Create Alert
          </button>
        </div>
      )}
    </div>
  );
};

export default PriceCard;