'use client';

import React, { useState } from 'react';
import MarketingLayout from '../marketing-layout';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <MarketingLayout>
      <section className="section-contact">
        <div className="padding-global different">
          <div className="container-large">
            <div className="section-padding-large">
              <div className="w-layout-grid contact-component">
                <div className="contact-content">
                  <div className="margin-bottom margin-medium">
                    <div className="contact-heading-wrapper">
                      <div data-w-id="690152ad-e676-e8f7-5170-747a2a8cae7e" style={{opacity:0}} className="tagline-pill bg-purple">
                        <div>Get in touch</div>
                      </div>
                      <div className="margin-bottom margin-xsmall">
                        <h1 data-w-id="5e73b729-bbe1-c93e-0326-062008d425f2" style={{opacity:0}} className="heading-style-h1 weight-medium align-left">Contact us</h1>
                      </div>
                      <p data-w-id="5e73b729-bbe1-c93e-0326-062008d425f4" style={{opacity:0}} className="text-size-medium max-width-small">
                        <strong>Not sure where to start?</strong><br />
                        Reach out to us and we'll help you explore how Taru can support learning, growth, and future readiness - with clarity and care.
                      </p>
                    </div>
                  </div>
                  <div data-w-id="5e73b729-bbe1-c93e-0326-062008d425f6" style={{opacity:0}} className="contact-list">
                    <a href="mailto:support@taru.live" className="contact-item w-inline-block">
                      <div className="contact-icon w-embed">
                        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 4H4C2.897 4 2 4.897 2 6V18C2 19.103 2.897 20 4 20H20C21.103 20 22 19.103 22 18V6C22 4.897 21.103 4 20 4ZM20 6V6.511L12 12.734L4 6.512V6H20ZM4 18V9.044L11.386 14.789C11.5611 14.9265 11.7773 15.0013 12 15.0013C12.2227 15.0013 12.4389 14.9265 12.614 14.789L20 9.044L20.002 18H4Z" fill="currentColor"></path>
                        </svg>
                      </div>
                      <div className="text-size-regular">support@taru.live</div>
                    </a>
                    <a href="tel:01234567890" className="contact-item w-inline-block">
                      <div className="contact-icon w-embed">
                        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.707 12.293C17.6142 12.2 17.504 12.1263 17.3827 12.076C17.2614 12.0257 17.1313 11.9998 17 11.9998C16.8687 11.9998 16.7386 12.0257 16.6173 12.076C16.496 12.1263 16.3858 12.2 16.293 12.293L14.699 13.887C13.96 13.667 12.581 13.167 11.707 12.293C10.833 11.419 10.333 10.04 10.113 9.30096L11.707 7.70696C11.7999 7.61417 11.8737 7.50397 11.924 7.38265C11.9743 7.26134 12.0002 7.13129 12.0002 6.99996C12.0002 6.86862 11.9743 6.73858 11.924 6.61726C11.8737 6.49595 11.7999 6.38575 11.707 6.29296L7.707 2.29296C7.61421 2.20001 7.50401 2.12627 7.38269 2.07596C7.26138 2.02565 7.13133 1.99976 7 1.99976C6.86866 1.99976 6.73862 2.02565 6.6173 2.07596C6.49599 2.12627 6.38579 2.20001 6.293 2.29296L3.581 5.00496C3.201 5.38496 2.987 5.90696 2.995 6.43996C3.018 7.86396 3.395 12.81 7.293 16.708C11.191 20.606 16.137 20.982 17.562 21.006H17.59C18.118 21.006 18.617 20.798 18.995 20.42L21.707 17.708C21.7999 17.6152 21.8737 17.505 21.924 17.3837C21.9743 17.2623 22.0002 17.1323 22.0002 17.001C22.0002 16.8696 21.9743 16.7396 21.924 16.6183C21.8737 16.4969 21.7999 16.3867 21.707 16.294L17.707 12.293ZM17.58 19.005C16.332 18.984 12.062 18.649 8.707 15.293C5.341 11.927 5.015 7.64196 4.995 6.41896L7 4.41396L9.586 6.99996L8.293 8.29296C8.17546 8.41041 8.08904 8.55529 8.04155 8.71453C7.99406 8.87376 7.987 9.04231 8.021 9.20496C8.045 9.31996 8.632 12.047 10.292 13.707C11.952 15.367 14.679 15.954 14.794 15.978C14.9565 16.0129 15.1253 16.0064 15.2846 15.9591C15.444 15.9117 15.5889 15.825 15.706 15.707L17 14.414L19.586 17L17.58 19.005V19.005Z" fill="currentColor"></path>
                        </svg>
                      </div>
                      <div className="text-size-regular">+91 1234567890</div>
                    </a>
                    <div className="contact-item">
                      <div className="contact-icon w-embed">
                        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 14C14.206 14 16 12.206 16 10C16 7.794 14.206 6 12 6C9.794 6 8 7.794 8 10C8 12.206 9.794 14 12 14ZM12 8C13.103 8 14 8.897 14 10C14 11.103 13.103 12 12 12C10.897 12 10 11.103 10 10C10 8.897 10.897 8 12 8Z" fill="currentColor"></path>
                          <path d="M11.42 21.814C11.5892 21.9349 11.792 21.9998 12 21.9998C12.208 21.9998 12.4107 21.9349 12.58 21.814C12.884 21.599 20.029 16.44 20 10C20 5.589 16.411 2 12 2C7.589 2 4 5.589 4 9.995C3.971 16.44 11.116 21.599 11.42 21.814ZM12 4C15.309 4 18 6.691 18 10.005C18.021 14.443 13.612 18.428 12 19.735C10.389 18.427 5.979 14.441 6 10C6 6.691 8.691 4 12 4Z" fill="currentColor"></path>
                        </svg>
                      </div>
                      <div className="text-size-regular">Baner, Pune, Maharashtra, India</div>
                    </div>
                  </div>
                </div>
                <div data-w-id="5e73b729-bbe1-c93e-0326-062008d42606" style={{opacity:0}} className="contact-form-block w-form" id="contact">
                  <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-field-2col">
                      <div className="form-field-wrapper">
                        <label htmlFor="Contact-Name" className="form-field-label">Name</label>
                        <input 
                          className="input-form w-input" 
                          maxLength={256} 
                          name="name" 
                          placeholder="Enter your name" 
                          type="text" 
                          id="Contact-Name" 
                          required
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-field-wrapper">
                        <label htmlFor="Contact-Phone" className="form-field-label">Phone</label>
                        <input 
                          className="input-form w-input" 
                          maxLength={256} 
                          name="phone" 
                          placeholder="Enter your phone number" 
                          type="tel" 
                          id="Contact-Phone" 
                          required
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="form-field-2col _1-only">
                      <div className="form-field-wrapper">
                        <label htmlFor="Contact-Email" className="form-field-label">Email</label>
                        <input 
                          className="input-form w-input" 
                          maxLength={256} 
                          name="email" 
                          placeholder="Enter your email" 
                          type="email" 
                          id="Contact-Email" 
                          required
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="form-field-wrapper">
                      <label htmlFor="Contact-Message" className="form-field-label">Message</label>
                      <textarea 
                        id="Contact-Message" 
                        name="message" 
                        maxLength={5000} 
                        placeholder="Type your message..." 
                        required 
                        className="input-form is-text-area w-input"
                        value={formData.message}
                        onChange={handleChange}
                      ></textarea>
                    </div>
                    <div className="form-button-wrapper">
                      <input type="submit" data-wait="Please wait..." className="button is-form w-button" value="Submit" />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <div className="section-faq">
        <section className="faq-component-wrapper">
          <div className="padding-global is-2rem grid">
            <div className="container-small">
              <div className="section-padding-large">
                <div className="margin-bottom margin-large">
                  <div className="text-align-center">
                    <div className="max-width-large align-center">
                      <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad5079" className="tagline-pill">
                        <div>FAQs</div>
                      </div>
                      <div className="margin-bottom margin-small">
                        <h2 data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad507d" className="heading-style-h2 weight-medium">Frequently Asked Questions</h2>
                      </div>
                      <p data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad507f" className="text-size-medium">We are often asked...</p>
                    </div>
                  </div>
                </div>
                <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad5081" className="faq-component">
                  <div className="w-layout-grid faq-list">
                    <div className="faq-accordion">
                      <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad5084" className="faq-question">
                        <div className="text-size-large weight-medium">What is Taru and who is it for?</div>
                        <div className="faq-icon-wrapper">
                          <div className="faq-icon w-embed">
                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M25.3333 15.667V16.3336C25.3333 16.7018 25.0349 17.0003 24.6667 17.0003H17V24.667C17 25.0351 16.7015 25.3336 16.3333 25.3336H15.6667C15.2985 25.3336 15 25.0351 15 24.667V17.0003H7.3333C6.96511 17.0003 6.66663 16.7018 6.66663 16.3336V15.667C6.66663 15.2988 6.96511 15.0003 7.3333 15.0003H15V7.33365C15 6.96546 15.2985 6.66699 15.6667 6.66699H16.3333C16.7015 6.66699 17 6.96546 17 7.33365V15.0003H24.6667C25.0349 15.0003 25.3333 15.2988 25.3333 15.667Z" fill="currentColor"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="faq-answer">
                        <div className="margin-bottom margin-small">
                          <p className="text-size-medium left">Taru is an AI-driven learning and career guidance platform designed for students across different stages of education. It also supports parents, teachers, and institutions by providing clarity, structure, and ethical guidance around learning and future pathways.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="faq-accordion">
                      <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad508e" className="faq-question">
                        <div className="text-size-large weight-medium">How is Taru different from other AI learning tools?</div>
                        <div className="faq-icon-wrapper">
                          <div className="faq-icon w-embed">
                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M25.3333 15.667V16.3336C25.3333 16.7018 25.0349 17.0003 24.6667 17.0003H17V24.667C17 25.0351 16.7015 25.3336 16.3333 25.3336H15.6667C15.2985 25.3336 15 25.0351 15 24.667V17.0003H7.3333C6.96511 17.0003 6.66663 16.7018 6.66663 16.3336V15.667C6.66663 15.2988 6.96511 15.0003 7.3333 15.0003H15V7.33365C15 6.96546 15.2985 6.66699 15.6667 6.66699H16.3333C16.7015 6.66699 17 6.96546 17 7.33365V15.0003H24.6667C25.0349 15.0003 25.3333 15.2988 25.3333 15.667Z" fill="currentColor"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="faq-answer">
                        <div className="margin-bottom margin-small">
                          <p className="text-size-medium left">Unlike generic AI tools that provide scattered suggestions, Taru follows a structured approach. It combines AI insights with proven learning methods and human mentorship to guide students step by step toward meaningful academic and career outcomes.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="faq-accordion">
                      <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad5098" className="faq-question">
                        <div className="text-size-large weight-medium">Is Taru only focused on engineering or medical careers?</div>
                        <div className="faq-icon-wrapper">
                          <div className="faq-icon w-embed">
                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M25.3333 15.667V16.3336C25.3333 16.7018 25.0349 17.0003 24.6667 17.0003H17V24.667C17 25.0351 16.7015 25.3336 16.3333 25.3336H15.6667C15.2985 25.3336 15 25.0351 15 24.667V17.0003H7.3333C6.96511 17.0003 6.66663 16.7018 6.66663 16.3336V15.667C6.66663 15.2988 6.96511 15.0003 7.3333 15.0003H15V7.33365C15 6.96546 15.2985 6.66699 15.6667 6.66699H16.3333C16.7015 6.66699 17 6.96546 17 7.33365V15.0003H24.6667C25.0349 15.0003 25.3333 15.2988 25.3333 15.667Z" fill="currentColor"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="faq-answer">
                        <div className="margin-bottom margin-small">
                          <p className="text-size-medium left">No. Taru encourages students to explore a wide range of paths including arts, sports, music, entrepreneurship, technology, and emerging fields. The platform helps students understand what suits them best and why.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="faq-accordion">
                      <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad50a2" className="faq-question">
                        <div className="text-size-large weight-medium">How can parents track and support their child's progress?</div>
                        <div className="faq-icon-wrapper">
                          <div className="faq-icon w-embed">
                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M25.3333 15.667V16.3336C25.3333 16.7018 25.0349 17.0003 24.6667 17.0003H17V24.667C17 25.0351 16.7015 25.3336 16.3333 25.3336H15.6667C15.2985 25.3336 15 25.0351 15 24.667V17.0003H7.3333C6.96511 17.0003 6.66663 16.7018 6.66663 16.3336V15.667C6.66663 15.2988 6.96511 15.0003 7.3333 15.0003H15V7.33365C15 6.96546 15.2985 6.66699 15.6667 6.66699H16.3333C16.7015 6.66699 17 6.96546 17 7.33365V15.0003H24.6667C25.0349 15.0003 25.3333 15.2988 25.3333 15.667Z" fill="currentColor"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="faq-answer">
                        <div className="margin-bottom margin-small">
                          <p className="text-size-medium left">Parents get visibility into their child's learning journey, interests, and skill development through a secure platform. This supports healthy conversations around goals and aspirations without pressure or comparison.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="faq-accordion">
                      <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad50ac" className="faq-question">
                        <div className="text-size-large weight-medium">Is Taru safe and secure for students?</div>
                        <div className="faq-icon-wrapper">
                          <div className="faq-icon w-embed">
                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M25.3333 15.667V16.3336C25.3333 16.7018 25.0349 17.0003 24.6667 17.0003H17V24.667C17 25.0351 16.7015 25.3336 16.3333 25.3336H15.6667C15.2985 25.3336 15 25.0351 15 24.667V17.0003H7.3333C6.96511 17.0003 6.66663 16.7018 6.66663 16.3336V15.667C6.66663 15.2988 6.96511 15.0003 7.3333 15.0003H15V7.33365C15 6.96546 15.2985 6.66699 15.6667 6.66699H16.3333C16.7015 6.66699 17 6.96546 17 7.33365V15.0003H24.6667C25.0349 15.0003 25.3333 15.2988 25.3333 15.667Z" fill="currentColor"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="faq-answer">
                        <div className="margin-bottom margin-small">
                          <p className="text-size-medium left">Yes. Taru is built with privacy, security, and student wellbeing as core principles. The platform promotes responsible AI usage and focuses on genuine learning and growth rather than shortcuts.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div data-w-id="1d0ba4ad-f8c4-6089-4ab8-228996ad50b5" className="faq-contact-wrapper">
                  <div className="text-align-center">
                    <div className="max-width-medium align-center">
                      <div className="margin-bottom margin-xsmall">
                        <h3 className="heading-style-h3 weight-medium white">Still have questions?</h3>
                      </div>
                      <p className="text-size-medium white center">Still have questions? Connect with our experts and get clear, thoughtful guidance about the Taru platform.</p>
                      <div className="margin-top margin-medium">
                        <div className="button-group is-center">
                          <a href="#contact" onClick={(e) => {
                            e.preventDefault();
                            document.querySelector('.contact-form-block')?.scrollIntoView({ behavior: 'smooth' });
                          }} className="button w-inline-block">
                            <div className="button-text-item">Contact Us</div>
                          </a>
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

export default Contact;
