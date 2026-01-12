import React from 'react';
import MarketingLayout from '../marketing-layout';

const DetailServices = () => {
  return (
    <MarketingLayout>
      <header className="section-hero-header">
        <div className="padding-global">
          <div className="container-large">
            <div className="section-padding-large">
              <div className="header-component">
                <div className="text-align-center">
                  <div className="max-width-large align-center">
                    <div className="margin-bottom margin-small">
                      <h1 className="heading-style-h1 weight-medium">Service Details</h1>
                    </div>
                    <p className="text-size-medium">Service description content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="section-service-description">
        <div className="service-description-wrapper">
          <div className="padding-global">
            <div className="container-small">
              <div className="section-padding-large">
                <div className="w-richtext">
                  <p>Service details content goes here...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default DetailServices;
