# Family Chore Manager & Calendar Hub

A professional, comprehensive family management solution featuring a chore tracker, analytics, and Cozi calendar integration. This all-in-one platform helps manage chores for multiple children while keeping track of the entire family's schedule through Cozi calendar integration.

## Features

### Chore Management
- **Multi-child Tracking:** Manage chores for all family members (Ember, Lilly, Levi, Eva, Elijah, and Kallie)
- **Drag & Drop Reordering:** Easily prioritize and rearrange chores
- **Schedule Types:** Categorize chores as daily, weekly, or monthly
- **Status Tracking:** Mark chores as complete and track completion rates

### Calendar Integration
- **Cozi Calendar Sync:** Integrate your family's Cozi calendar for a unified view
- **Multiple Views:** Daily, weekly, and monthly calendar views
- **Filters:** Filter events by family member or type (chores vs. calendar events)
- **Combined Timeline:** See both chores and family events in a single interface

### Reports & Analytics
- **Completion Stats:** Visualize chore completion rates for each child
- **Distribution Analysis:** See the distribution of chore types and assignments
- **Progress Tracking:** Weekly and monthly trend tracking
- **Print Options:** Generate filtered reports and checklists

### Professional UI
- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Dark/Light Themes:** Choose between light and dark interface modes
- **User Preferences:** Save default child selection, calendar view preference, and more

## Getting Started

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/family-chore-manager.git
   cd family-chore-manager
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser to `http://localhost:8888`

### Cozi Calendar Integration

1. Get your Cozi Calendar iCal URL:
   - Log in to your Cozi account
   - Go to Settings > Calendar Settings
   - Find your iCalendar feed URL
   - Copy the URL (it will look like `https://rest.cozi.com/api/ext/1103/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/icalendar/feed/feed.ics`)

2. In the Family Chore Manager:
   - Click "Cozi Calendar" in the header
   - Paste your iCalendar feed URL
   - Click "Save & Connect"

## Deployment

This is a Netlify-ready application. To deploy:

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

Alternatively, you can deploy directly from your local machine:

```
npm run build
netlify deploy --prod
```

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, FullCalendar.js, Chart.js
- **Backend:** Netlify Functions (serverless)
- **Data Storage:** Local Storage for user preferences and chore data
- **Calendar Integration:** ical.js for parsing iCal feeds from Cozi

## Customization

You can customize this application by:

- Modifying `index.html` to change the layout
- Editing `css/styles.css` to change the appearance
- Updating the children's names in the selector dropdowns
- Adding new chart types in `js/charts.js`

## License

This project is provided for personal use and can be customized to meet your family's needs.

## Acknowledgements

- Built with ❤️ for Michelle's family
- Icons from Font Awesome and Icons8
- Calendar functionality powered by FullCalendar
- Charts rendered with Chart.js