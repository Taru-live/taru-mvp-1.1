'use client';

import React from 'react';
import MarketingLayout from '../marketing-layout';
import Link from 'next/link';

const Pricing = () => {
  return (
    <MarketingLayout>
      <header className="section-hero-header">
        <div className="padding-global different">
          <div className="container-large">
            <div className="section-padding-large">
              <div className="header-component">
                <div className="text-align-center">
                  <div className="max-width-large align-center">
                    <div data-w-id="0ee7d3df-50a2-894c-822c-fa26a317dce8" style={{opacity:0}} className="tagline-pill">
                      <div>Pricing</div>
                    </div>
                    <div className="margin-bottom margin-small">
                      <h1 data-w-id="3f1ce910-7bb7-b2bb-a95e-b18005f9e54c" style={{opacity:0}} className="heading-style-h1 weight-medium">Affordable AI-Driven Learning for Every Student</h1>
                    </div>
                    <p data-w-id="3f1ce910-7bb7-b2bb-a95e-b18005f9e54e" style={{opacity:0}} className="text-size-medium">Choose the plan that works best for you. Individual students or groups - we have flexible pricing options to make quality education accessible.</p>
                    <div className="margin-top margin-medium">
                      <div data-w-id="3f1ce910-7bb7-b2bb-a95e-b18005f9e551" style={{opacity:0}} className="button-group is-center">
                        <Link href="/contact" className="button w-inline-block">
                          <div className="button-text-item">Get in touch</div>
                        </Link>
                        <Link href="/contact" className="button-secondary w-inline-block">
                          <div className="button-text-item">Book a call</div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="section-case-studies">
        <section className="case-studies-component-wrapper">
          <div className="padding-global is-2rem different padding">
            <div className="pricing_wrap">
              <div className="pricing_title-wrap">
                <h1 data-w-id="1d72323c-aea2-bae8-c863-ce331e9ec12d" style={{opacity:0}} className="text-size-large-2">Taru Learning<br />Subscription Plans</h1>
              </div>
              <div className="pricing_tabs-content">
                <style dangerouslySetInnerHTML={{
                  __html: `
                    .pricing_grid-custom {
                      grid-template-columns: 1fr 1fr !important;
                      grid-column-gap: 40px;
                      grid-row-gap: 40px;
                      max-width: 1000px;
                      margin: 0 auto;
                      width: 100%;
                      align-items: stretch;
                    }
                    .pricing_card-animation {
                      display: flex;
                      height: 100%;
                    }
                    .pricing_card {
                      display: flex;
                      width: 100%;
                      height: 100%;
                    }
                    .pricing_first-card {
                      display: flex;
                      flex-direction: column;
                      width: 100%;
                      height: 100%;
                    }
                    .pricing_price-wrap {
                      display: flex;
                      flex-direction: column;
                      align-items: flex-start;
                      margin: 20px 0;
                    }
                    @media (max-width: 991px) {
                      .pricing_grid-custom {
                        grid-template-columns: 1fr !important;
                        max-width: 100% !important;
                        grid-column-gap: 30px;
                      }
                    }
                    @media (max-width: 767px) {
                      .pricing_grid-custom {
                        grid-column-gap: 20px;
                      }
                    }
                  `
                }} />
                <div className="w-layout-grid pricing_grid pricing_grid-custom">
                  <div data-w-id="1d72323c-aea2-bae8-c863-ce331e9ec13c" className="pricing_card-animation">
                    <div className="pricing_card">
                      <div data-w-id="1d72323c-aea2-bae8-c863-ce331e9ec13e" style={{opacity:0}} className="pricing_first-card">
                        <div className="pricing_card-corner">
                          <a href="#" onClick={(e) => e.preventDefault()} className="pricing_corner w-inline-block">
                            <img loading="lazy" src="/images/arrow-right-up-svgrepo-com.svg" alt="" className="pricing_arrow-image" />
                          </a>
                        </div>
                        <div className="pricing_front-content">
                          <div className="pricing_card-wrap">
                            <div className="pricing_card-text">
                              <div className="text-size-small-2">Individual Student</div>
                            </div>
                            <a href="#" onClick={(e) => e.preventDefault()} className="pricing_card-link w-inline-block">
                              <img loading="lazy" src="/images/plus-large-svgrepo-com-1.svg" alt="" className="pricing_plus-image" />
                            </a>
                          </div>
                          <div className="pricing_price-wrap">
                            <div className="text-size-xlarge text-weight-bold">₹99</div>
                            <div className="text-size-small-2" style={{marginTop: '8px', opacity: 0.8}}>per month</div>
                          </div>
                          <div className="pricing_bottom-wrap">
                            <div className="text-size-small-2 text-weight-medium">Perfect for individual students seeking personalized AI-driven career guidance and structured learning paths.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div data-w-id="1d72323c-aea2-bae8-c863-ce331e9ec15e" className="pricing_card-animation">
                    <div className="pricing_card is-second">
                      <div data-w-id="1d72323c-aea2-bae8-c863-ce331e9ec160" style={{opacity:0}} className="pricing_first-card is-second">
                        <div className="pricing_card-corner">
                          <a href="#" onClick={(e) => e.preventDefault()} className="pricing_corner is-second w-inline-block">
                            <img loading="lazy" src="/images/arrow-right-up-svgrepo-com.svg" alt="" className="pricing_arrow-image" />
                          </a>
                        </div>
                        <div className="pricing_front-content">
                          <div className="pricing_card-wrap">
                            <div className="pricing_card-text">
                              <div className="text-size-small-2">Group Plan</div>
                            </div>
                            <a href="#" onClick={(e) => e.preventDefault()} className="pricing_card-link is-second w-inline-block">
                              <img loading="lazy" src="/images/plus-large-svgrepo-com-1.svg" alt="" className="pricing_plus-image is-second" />
                            </a>
                          </div>
                          <div className="pricing_price-wrap">
                            <div className="text-size-xlarge text-weight-bold">₹79</div>
                            <div className="text-size-small-2" style={{marginTop: '8px', opacity: 0.8}}>per month per student</div>
                            <div className="text-size-small-2" style={{marginTop: '4px', opacity: 0.7, fontStyle: 'italic'}}>(Minimum 5 students)</div>
                          </div>
                          <div className="pricing_bottom-wrap">
                            <div className="text-size-small-2 text-weight-medium">Ideal for groups of 5 or more students. Save more with our group discount while accessing all premium features.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Pricing;
