import React from 'react';

interface DiscoveryFeedProps {
  // Add the onDeveloperDelete prop to the DiscoveryFeedProps interface
  onDeveloperDelete?: (productId: string) => void;
}

const DiscoveryFeed: React.FC<DiscoveryFeedProps> = ({ onDeveloperDelete }) => {
  const isDeveloper = true; // Define the isDeveloper variable
  const mockDeveloperDelete = (productId: string) => {
    // Define the mockDeveloperDelete function
    console.log(`Mock deleting product with ID: ${productId}`);
  };

  return (
    <div>
      {/* Use the onDeveloperDelete prop correctly */}
      {isDeveloper && (
        <button onClick={() => onDeveloperDelete('some-product-id')}>
          Delete Product
        </button>
      )}
    </div>
  );
};

export default DiscoveryFeed;