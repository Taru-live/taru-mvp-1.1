import React from 'react';
import Image from 'next/image';
import MarketingLayout from '../marketing-layout';

const DetailBlog = () => {
  return (
    <MarketingLayout>
      <header className="section-blog-header">
        <div className="padding-global">
          <div className="container-large">
            <div className="section-padding-large">
              <div className="blog-header-component">
                <div className="margin-bottom margin-large">
                  <div className="w-layout-grid blog-header-content-wrapper">
                    <div className="blog-content">
                      <div className="blog-date-wrapper">
                        <div className="blog-date">
                          <div>Date</div>
                        </div>
                      </div>
                      <div className="margin-bottom margin-xsmall">
                        <h1 className="heading-style-h1 weight-medium">Blog Title</h1>
                      </div>
                      <div className="text-size-medium">Blog description</div>
                    </div>
                  </div>
                </div>
                <div className="blog-header-image-wrapper">
                  <Image src="/images/adrian-cuj-o_9YmCY0bag-unsplash-6.webp" width={1200} height={600} alt="" className="blog-header-image" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="section-blog-details">
        <div className="blog-details-wrapper">
          <div className="padding-global">
            <div className="container-small">
              <div className="section-padding-large">
                <div className="w-richtext">
                  <p>Blog content goes here...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default DetailBlog;
