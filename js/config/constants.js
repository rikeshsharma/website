/*
  Small shared config, intentionally the only global this project defines.
  Classic <script> tags (no bundler, no ES modules — see README) can't share
  state via import/export, so this single frozen namespace stands in for it
  instead of scattering magic numbers/strings across every component file.
*/

const PortfolioConfig = Object.freeze({
  OBSERVER_THRESHOLD: 0.15,
  CONTACT_HISTORY_STORAGE_KEY: "contactHistory",
});
