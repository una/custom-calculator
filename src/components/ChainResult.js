import React from 'react';

function ChainResult({ results }) {
  if (results.length === 0) {
    return null;
  }

  const finalResult = results[results.length - 1]?.result;

  return (
    <div className="result-section">
      <h3>Calculation Steps</h3>
      <ul className="result-steps">
        {results.map((item, index) => (
          <li key={index}>
            <span className="result-step-name">{item.name}:</span>
            <span className="result-step-value">{item.result}</span>
          </li>
        ))}
      </ul>
      <div className="result">
        Final Result: {finalResult}
      </div>
    </div>
  );
}

export default ChainResult;