import React from 'react';

function CalculationChain({ chain, onRemove, onClear }) {
  if (chain.length === 0) {
    return null; // Don't render anything if the chain is empty
  }

  return (
    <div className="form-section">
      <h2>Calculation Chain</h2>
      <ol className="calculation-chain-list">
        {chain.map((func, index) => (
          <li key={`${func.name}-${index}`}>
            <span>{func.name}</span>
            <button className="remove-btn" onClick={() => onRemove(index)}>Remove</button>
          </li>
        ))}
      </ol>
      {chain.length > 0 && (
        <div className="form-actions">
          <button className="cancel-btn" onClick={onClear}>Clear Chain</button>
        </div>
      )}
    </div>
  );
}

export default CalculationChain;