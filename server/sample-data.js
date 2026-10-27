// Offline sample payloads in the same shape the MTA serves.
// Used when USE_SAMPLE_DATA=1, when an upstream call fails, and by the tests.
// Content is illustrative, not live service information.

const t = (text) => ({ translation: [{ text, language: 'en' }] });

export function sampleAlerts(now = Date.now()) {
  const s = Math.floor(now / 1000);
  const period = [{ start: s - 3600, end: s + 3 * 3600 }];
  return {
    header: { gtfs_realtime_version: '1.0', timestamp: s },
    entity: [
      {
        id: 'sample:delay-ace',
        alert: {
          active_period: period,
          informed_entity: [{ route_id: 'A' }, { route_id: 'C' }],
          header_text: t('[A][C] trains are running with delays in both directions while crews address signal problems near Jay St-MetroTech.'),
          'transit_realtime.mercury_alert': { alert_type: 'Delays', updated_at: s - 600 },
        },
      },
      {
        id: 'sample:suspend-g',
        alert: {
          active_period: period,
          informed_entity: [{ route_id: 'G' }],
          header_text: t('No [G] trains between Court Sq and Nassau Av. Free shuttle buses provide alternate service.'),
          'transit_realtime.mercury_alert': { alert_type: 'Planned - Part Suspended', updated_at: s - 7200 },
        },
      },
      {
        id: 'sample:reroute-n',
        alert: {
          active_period: period,
          informed_entity: [{ route_id: 'N' }, { route_id: 'W' }],
          header_text: t('Manhattan-bound [N][W] trains skip 39 Av-Dutch Kills.'),
          'transit_realtime.mercury_alert': { alert_type: 'Planned - Stations Skipped', updated_at: s - 5400 },
        },
      },
      {
        id: 'sample:delay-7',
        alert: {
          active_period: period,
          informed_entity: [{ route_id: '7' }],
          header_text: t('[7] trains are running with some delays after we addressed a train with mechanical problems at Hunters Point Av.'),
          'transit_realtime.mercury_alert': { alert_type: 'Delays', updated_at: s - 300 },
        },
      },
      {
        id: 'sample:expired',
        alert: {
          active_period: [{ start: s - 9000, end: s - 3600 }],
          informed_entity: [{ route_id: '1' }],
          header_text: t('This alert has ended and should be filtered out.'),
          'transit_realtime.mercury_alert': { alert_type: 'Delays' },
        },
      },
    ],
  };
}

export function sampleOutages() {
  return [
    { station: 'Jay St-MetroTech', borough: 'BKN', trainno: 'A/C/F/R', equipment: 'EL230', equipmenttype: 'EL', serving: 'Street to mezzanine for service in both directions', ADA: 'Y', outagedate: '10/23/2026 06:10:00 AM', estimatedreturntoservice: '10/28/2026 11:00:00 PM', reason: 'Repair', isupcomingoutage: 'N', ismaintenanceoutage: 'N' },
    { station: 'Court Sq', borough: 'QNS', trainno: '7/E/M/G', equipment: 'ES445', equipmenttype: 'ES', serving: 'Mezzanine to 7 platform', ADA: 'N', outagedate: '10/20/2026 09:00:00 AM', estimatedreturntoservice: '11/02/2026 05:00:00 PM', reason: 'Capital Replacement', isupcomingoutage: 'N', ismaintenanceoutage: 'Y' },
    { station: '21 St-Queensbridge', borough: 'QNS', trainno: 'F', equipment: 'ES620', equipmenttype: 'ES', serving: 'Street to mezzanine', ADA: 'N', outagedate: '10/01/2026 07:30:00 AM', estimatedreturntoservice: '11/15/2026 05:00:00 PM', reason: 'Repair', isupcomingoutage: 'N', ismaintenanceoutage: 'N' },
    { station: 'Jackson Hts-Roosevelt Av', borough: 'QNS', trainno: 'E/F/M/R/7', equipment: 'EL402', equipmenttype: 'EL', serving: 'Mezzanine to Manhattan-bound E/F platform', ADA: 'Y', outagedate: '10/26/2026 02:15:00 PM', estimatedreturntoservice: '10/27/2026 11:00:00 PM', reason: 'Repair', isupcomingoutage: 'N', ismaintenanceoutage: 'N' },
    { station: 'Times Sq-42 St', borough: 'MAN', trainno: '1/2/3/7/N/Q/R/W/S', equipment: 'EL119', equipmenttype: 'EL', serving: 'Mezzanine to uptown 1/2/3 platform', ADA: 'Y', outagedate: '10/30/2026 10:00:00 PM', estimatedreturntoservice: '10/31/2026 05:00:00 AM', reason: 'Preventive Maintenance', isupcomingoutage: 'Y', ismaintenanceoutage: 'Y' },
  ];
}

// A decoded-feed-shaped object with trip updates relative to `now`.
export function sampleTripFeed(routes, parentStopId, now = Date.now()) {
  const s = Math.floor(now / 1000);
  const entity = [];
  let n = 0;
  for (const route of routes) {
    for (const dir of ['N', 'S']) {
      for (let i = 0; i < 4; i += 1) {
        const offset = 60 + ((route.charCodeAt(0) * 37 + i * 311 + (dir === 'N' ? 0 : 97)) % 240) + i * 300;
        entity.push({
          id: `sample-${n += 1}`,
          tripUpdate: {
            trip: { tripId: `sample_${route}_${dir}_${i}`, routeId: route },
            stopTimeUpdate: [{ stopId: `${parentStopId}${dir}`, arrival: { time: s + offset } }],
          },
        });
      }
    }
  }
  return { entity };
}
