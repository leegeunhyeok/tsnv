let nextAssetId = 1;
const assets = new Map();

exports.registerAsset = function registerAsset(asset) {
  const assetId = nextAssetId++;
  assets.set(assetId, asset);
  return assetId;
};

exports.getAssetByID = function getAssetByID(assetId) {
  return assets.get(assetId);
};
