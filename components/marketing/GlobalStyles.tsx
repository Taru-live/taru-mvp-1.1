'use client';

import React from 'react';

const GlobalStyles = () => {
  return (
    <div className="global-styles w-embed">
      <style>
        {`
/* Focus state style for keyboard navigation for the focusable elements */
*[tabindex]:focus-visible,
  input[type="file"]:focus-visible {
   outline: 0.125rem solid #4d65ff;
   outline-offset: 0.125rem;
}
/* Get rid of top margin on first element in any rich text element */
.w-richtext > :not(div):first-child, .w-richtext > div:first-child > :first-child {
  margin-top: 0 !important;
}
/* Get rid of bottom margin on last element in any rich text element */
.w-richtext>:last-child, .w-richtext ol li:last-child, .w-richtext ul li:last-child {
	margin-bottom: 0 !important;
}
/* Prevent all click and hover interaction with an element */
.pointer-events-off {
	pointer-events: none;
}
/* Enables all click and hover interaction with an element */
.pointer-events-on {
  pointer-events: auto;
}
/* Make sure containers never lose their center alignment */
.container-medium,.container-small, .container-large {
	margin-right: auto !important;
  margin-left: auto !important;
}
/* These classes are never overwritten */
.hide {
  display: none !important;
}
@media screen and (max-width: 991px) {
    .hide, .hide-tablet {
        display: none !important;
    }
}
  @media screen and (max-width: 767px) {
    .hide-mobile-landscape{
      display: none !important;
    }
}
  @media screen and (max-width: 479px) {
    .hide-mobile{
      display: none !important;
    }
}
.margin-0 {
  margin: 0rem !important;
}
.padding-0 {
  padding: 0rem !important;
}
.margin-top {
  margin-right: 0rem !important;
  margin-bottom: 0rem !important;
  margin-left: 0rem !important;
}
.padding-top {
  padding-right: 0rem !important;
  padding-bottom: 0rem !important;
  padding-left: 0rem !important;
}
.margin-right {
  margin-top: 0rem !important;
  margin-bottom: 0rem !important;
  margin-left: 0rem !important;
}
.padding-right {
  padding-top: 0rem !important;
  padding-bottom: 0rem !important;
  padding-left: 0rem !important;
}
.margin-bottom {
  margin-top: 0rem !important;
  margin-right: 0rem !important;
  margin-left: 0rem !important;
}
.padding-bottom {
  padding-top: 0rem !important;
  padding-right: 0rem !important;
  padding-left: 0rem !important;
}
.margin-left {
  margin-top: 0rem !important;
  margin-right: 0rem !important;
  margin-bottom: 0rem !important;
}
.padding-left {
  padding-top: 0rem !important;
  padding-right: 0rem !important;
  padding-bottom: 0rem !important;
}
.margin-horizontal {
  margin-top: 0rem !important;
  margin-bottom: 0rem !important;
}
.padding-horizontal {
  padding-top: 0rem !important;
  padding-bottom: 0rem !important;
}
.margin-vertical {
  margin-right: 0rem !important;
  margin-left: 0rem !important;
}
.padding-vertical {
  padding-right: 0rem !important;
  padding-left: 0rem !important;
}
/* CRITICAL: Ensure content is ALWAYS visible */
/* This ensures users never see blank pages */

/* Make all elements with data-w-id visible immediately */
/* Webflow animations will still work - they'll animate from visible state */
[data-w-id][style*="opacity:0"],
[data-w-id][style*="opacity: 0"],
[data-w-id][style*="opacity:0;"],
[data-w-id][style*="opacity: 0;"] {
  opacity: 1 !important;
  transition: opacity 0.6s ease;
}

/* Keep content visible even when Webflow is ready */
/* Webflow can still trigger animations and transitions */
body.webflow-ready [data-w-id][style*="opacity:0"],
body.webflow-ready [data-w-id][style*="opacity: 0"],
body.webflow-ready [data-w-id][style*="opacity:0;"],
body.webflow-ready [data-w-id][style*="opacity: 0;"] {
  /* Content stays visible - Webflow animations will still work */
  opacity: 1 !important;
  transition: opacity 0.6s ease;
}

/* Ensure proper text alignment and layout for content sections */
.div-block-5 > div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.div-block-5 .heading-7 {
  margin-bottom: 6px;
  line-height: 1.3;
}

.div-block-5 .text-block-3 {
  line-height: 1.5;
  text-align: left;
}

/* Ensure content-div sections have proper layout */
.content-div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.content-div .heading-3 {
  margin-bottom: 8px;
  line-height: 1.3;
}

.content-div .text-block-2 {
  line-height: 1.6;
  text-align: left;
}
        `}
      </style>
    </div>
  );
};

export default GlobalStyles;
