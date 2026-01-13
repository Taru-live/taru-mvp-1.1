import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get OAuth data from cookie
    const oauthDataCookie = request.cookies.get('google-oauth-data')?.value;
    
    if (!oauthDataCookie) {
      return NextResponse.json(
        { oauthData: null },
        { status: 200 }
      );
    }

    // Parse OAuth data
    const oauthData = JSON.parse(oauthDataCookie);
    
    // Check if data is expired (10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    if (oauthData.timestamp < tenMinutesAgo) {
      // Clear expired cookie
      const response = NextResponse.json(
        { oauthData: null },
        { status: 200 }
      );
      response.cookies.delete('google-oauth-data');
      return response;
    }

    // Return OAuth data (without sensitive info)
    return NextResponse.json({
      oauthData: {
        email: oauthData.email,
        name: oauthData.name,
        picture: oauthData.picture,
        googleId: oauthData.googleId
      }
    });

  } catch (error) {
    console.error('Error fetching OAuth data:', error);
    return NextResponse.json(
      { oauthData: null },
      { status: 200 }
    );
  }
}
