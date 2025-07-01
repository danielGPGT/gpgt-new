import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SavedItinerary } from '@/lib/itineraryService';
import { useTier } from '@/hooks/useTier';
import { toast } from 'sonner';

// Helper function to format date with day of the week
const formatDateWithDay = (dateString: string) => {
  const date = new Date(dateString);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `${dayOfWeek}, ${formattedDate}`;
};

interface PDFExportButtonProps {
  itinerary: SavedItinerary;
  className?: string;
}

export function PDFExportButton({ itinerary, className }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { canDownloadPDF, getLimitReachedMessage, incrementUsage } = useTier();

  const exportToPDF = async () => {
    // Check if user can download PDFs
    if (!canDownloadPDF()) {
      toast.error(getLimitReachedMessage('pdf_downloads'));
      return;
    }

    setIsExporting(true);
    try {
      // Create a completely isolated iframe to prevent CSS inheritance
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '800px';
      iframe.style.height = '1200px';
      iframe.style.border = 'none';
      
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        iframe.src = 'about:blank';
      });
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Failed to access iframe document');
      
      // Set up the iframe document with minimal CSS
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: Arial, sans-serif !important;
            }
            body {
              font-family: Arial, sans-serif !important;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              background: white;
              padding: 30px;
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f59e0b; padding-bottom: 15px;">
            <h1 style="color: #f59e0b; font-size: 24px; margin: 0; font-weight: bold;">${itinerary.title}</h1>
            <p style="color: #666; font-size: 14px; margin: 8px 0 0 0;">Luxury Travel Itinerary</p>
          </div>

          <div style="margin-bottom: 25px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <h3 style="margin: 0 0 6px 0; color: #f59e0b; font-size: 11px; font-weight: bold; text-transform: uppercase;">CLIENT</h3>
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #333;">${itinerary.client_name}</p>
              </div>
              <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <h3 style="margin: 0 0 6px 0; color: #f59e0b; font-size: 11px; font-weight: bold; text-transform: uppercase;">DESTINATION</h3>
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #333;">${itinerary.destination}</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <h3 style="margin: 0 0 6px 0; color: #f59e0b; font-size: 11px; font-weight: bold; text-transform: uppercase;">DURATION</h3>
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #333;">${itinerary.days?.length || 0} Days</p>
              </div>
              <div style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border-left: 3px solid #f59e0b;">
                <h3 style="margin: 0 0 6px 0; color: #f59e0b; font-size: 11px; font-weight: bold; text-transform: uppercase;">CREATED</h3>
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #333;">${formatDateWithDay(itinerary.date_created)}</p>
              </div>
            </div>
          </div>

          ${(itinerary.preferences as any)?.summary ? `
          <div style="margin-bottom: 25px; background-color: #fef3c7; padding: 15px; border-radius: 6px; border: 1px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: bold;">Trip Summary</h3>
            <p style="margin: 0; line-height: 1.5; color: #92400e; font-size: 12px;">${(itinerary.preferences as any).summary}</p>
          </div>
          ` : ''}

          <div style="margin-bottom: 25px;">
            <h2 style="color: #f59e0b; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; font-weight: bold;">Daily Schedule</h2>
            ${itinerary.days?.map((day, index) => `
              <div style="margin-bottom: 20px; background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <div style="background-color: #f59e0b; color: white; padding: 12px 15px;">
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold;">Day ${index + 1} - ${formatDateWithDay(day.date)}</h3>
                </div>
                <div style="padding: 15px;">
                  ${day.activities?.map((activity, actIndex) => `
                    <div style="margin-bottom: 12px; padding-bottom: 12px; ${actIndex < day.activities.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                      <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="background-color: #f59e0b; color: white; padding: 6px 10px; border-radius: 15px; font-size: 10px; font-weight: bold; min-width: 50px; text-align: center;">
                          ${activity.time || 'TBD'}
                        </div>
                        <div style="flex: 1;">
                          <p style="margin: 0 0 4px 0; font-weight: bold; font-size: 12px; color: #333;">${activity.description}</p>
                          ${activity.location ? `<p style="margin: 0 0 4px 0; font-size: 10px; color: #666;">📍 ${activity.location}</p>` : ''}
                          ${activity.notes ? `<p style="margin: 0 0 4px 0; font-size: 10px; color: #666; font-style: italic;">${activity.notes}</p>` : ''}
                          ${activity.estimatedCost ? `<p style="margin: 0; font-size: 10px; color: #f59e0b; font-weight: bold;">$${activity.estimatedCost} (${activity.costType || 'total'})</p>` : ''}
                        </div>
                      </div>
                    </div>
                  `).join('') || '<p style="color: #666; font-style: italic; font-size: 11px;">No activities scheduled</p>'}
                </div>
              </div>
            `).join('') || '<p style="color: #666; font-style: italic; font-size: 11px;">No days scheduled</p>'}
          </div>

          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 10px;">
            <p style="margin: 0;">Generated by LuxeTripBuilder</p>
            <p style="margin: 3px 0 0 0;">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
        </html>
      `);
      iframeDoc.close();
      
      // Wait a moment for the content to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Convert iframe content to canvas
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: iframeDoc.body.scrollHeight,
        logging: false,
        removeContainer: true
      });

      // Remove the iframe
      document.body.removeChild(iframe);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // Save the PDF
      pdf.save(`${itinerary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.pdf`);

      // Increment usage after successful download
      await incrementUsage('pdf_downloads');
      toast.success('PDF exported successfully!');

    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={exportToPDF}
      disabled={isExporting || !canDownloadPDF()}
      variant="outline"
      size="sm"
      className={className}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-1" />
          Export PDF
        </>
      )}
    </Button>
  );
} 