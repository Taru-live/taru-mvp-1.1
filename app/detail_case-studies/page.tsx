import React from 'react';
import Image from 'next/image';
import MarketingLayout from '../marketing-layout';

const DetailCaseStudies = () => {
  return (
    <MarketingLayout>
      <header className="section-case-study-header">
        <div className="padding-global">
          <div className="container-large">
            <div className="section-padding-large">
              <div className="case-study-header-component">
                <div className="margin-bottom margin-large">
                  <div className="w-layout-grid case-study-header-content-wrapper">
                    <div className="case-study-content-left">
                      <div className="case-study-tags-list">
                        <div className="project-tag">
                          <div>Tag 1</div>
                        </div>
                        <div className="project-tag">
                          <div>Tag 2</div>
                        </div>
                      </div>
                      <div className="margin-bottom margin-xsmall">
                        <h1 className="heading-style-h1 weight-medium">Case Study Title</h1>
                      </div>
                      <div className="text-size-medium">Case study description</div>
                    </div>
                    <div className="w-layout-grid case-study-information-wrapper">
                      <div className="case-study-information-item">
                        <div className="margin-bottom margin-xsmall">
                          <div className="heading-style-h6">Objective</div>
                        </div>
                        <div className="text-size-regular">Objective content</div>
                      </div>
                      <div className="case-study-information-item">
                        <div className="margin-bottom margin-xsmall">
                          <div className="heading-style-h6">Strategy</div>
                        </div>
                        <div className="text-size-regular">Strategy content</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="case-study-header-image-wrapper">
                  <Image src="/images/adrian-cuj-o_9YmCY0bag-unsplash-6.webp" width={1200} height={600} alt="" className="case-study-header-image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="section-case-study-details">
        <div className="case-study-details-wrapper">
          <div className="padding-global">
            <div className="container-small">
              <div className="section-padding-large">
                <div className="w-richtext">
                  <p>Case study details content goes here...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default DetailCaseStudies;
