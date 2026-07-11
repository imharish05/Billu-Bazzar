import { Component } from 'react';

/**
 * react-360-view bundles its own nested React 16 copy (a known quirk of
 * that package — check node_modules/react-360-view/package.json). It
 * renders fine in the common case, but a dual-React tree occasionally
 * misbehaves. This boundary catches that failure mode and hands off to
 * the in-house fallback viewer instead of crashing the product page.
 */
class ThreeSixtyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[react-360-view] render failed, falling back:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default ThreeSixtyErrorBoundary;