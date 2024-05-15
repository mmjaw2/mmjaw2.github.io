// Copyright 2015-2024, University of Colorado Boulder

/**
 * Main entry point for the sim.
 *
 * @author Andrea Lin (PhET Interactive Simulations)
 */

import Sim from '../../joist/js/Sim.js';
import simLauncher from '../../joist/js/simLauncher.js';
import Tandem from '../../tandem/js/Tandem.js';
import DragScreen from './drag/DragScreen.js';
import IntroScreen from './intro/IntroScreen.js';
import LabScreen from './lab/LabScreen.js';
import ProjectileMotionStrings from './ProjectileMotionStrings.js';
import VectorsScreen from './vectors/VectorsScreen.js';
const projectileMotionTitleString = ProjectileMotionStrings['projectile-motion'].titleStringProperty;
const simOptions = {
  credits: {
    leadDesign: 'Amy Rouinfar, Mike Dubson',
    softwareDevelopment: 'Andrea Lin, Matthew Blackman',
    team: 'Ariel Paul, Kathy Perkins, Amanda McGarry, Wendy Adams, John Blanco',
    qualityAssurance: 'Steele Dalton, Alex Dornan, Ethan Johnson, Liam Mulhall',
    graphicArts: 'Mariah Hermsmeyer, Cheryl McCutchan'
  }
};
simLauncher.launch(() => {
  const sim = new Sim(projectileMotionTitleString, [new IntroScreen(Tandem.ROOT.createTandem('introScreen')), new VectorsScreen(Tandem.ROOT.createTandem('vectorsScreen')), new DragScreen(Tandem.ROOT.createTandem('dragScreen')), new LabScreen(Tandem.ROOT.createTandem('labScreen'))], simOptions);
  sim.start();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJTaW0iLCJzaW1MYXVuY2hlciIsIlRhbmRlbSIsIkRyYWdTY3JlZW4iLCJJbnRyb1NjcmVlbiIsIkxhYlNjcmVlbiIsIlByb2plY3RpbGVNb3Rpb25TdHJpbmdzIiwiVmVjdG9yc1NjcmVlbiIsInByb2plY3RpbGVNb3Rpb25UaXRsZVN0cmluZyIsInRpdGxlU3RyaW5nUHJvcGVydHkiLCJzaW1PcHRpb25zIiwiY3JlZGl0cyIsImxlYWREZXNpZ24iLCJzb2Z0d2FyZURldmVsb3BtZW50IiwidGVhbSIsInF1YWxpdHlBc3N1cmFuY2UiLCJncmFwaGljQXJ0cyIsImxhdW5jaCIsInNpbSIsIlJPT1QiLCJjcmVhdGVUYW5kZW0iLCJzdGFydCJdLCJzb3VyY2VzIjpbInByb2plY3RpbGUtbW90aW9uLW1haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTUtMjAyNCwgVW5pdmVyc2l0eSBvZiBDb2xvcmFkbyBCb3VsZGVyXHJcblxyXG4vKipcclxuICogTWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIHNpbS5cclxuICpcclxuICogQGF1dGhvciBBbmRyZWEgTGluIChQaEVUIEludGVyYWN0aXZlIFNpbXVsYXRpb25zKVxyXG4gKi9cclxuXHJcbmltcG9ydCBTaW0gZnJvbSAnLi4vLi4vam9pc3QvanMvU2ltLmpzJztcclxuaW1wb3J0IHNpbUxhdW5jaGVyIGZyb20gJy4uLy4uL2pvaXN0L2pzL3NpbUxhdW5jaGVyLmpzJztcclxuaW1wb3J0IFRhbmRlbSBmcm9tICcuLi8uLi90YW5kZW0vanMvVGFuZGVtLmpzJztcclxuaW1wb3J0IERyYWdTY3JlZW4gZnJvbSAnLi9kcmFnL0RyYWdTY3JlZW4uanMnO1xyXG5pbXBvcnQgSW50cm9TY3JlZW4gZnJvbSAnLi9pbnRyby9JbnRyb1NjcmVlbi5qcyc7XHJcbmltcG9ydCBMYWJTY3JlZW4gZnJvbSAnLi9sYWIvTGFiU2NyZWVuLmpzJztcclxuaW1wb3J0IFByb2plY3RpbGVNb3Rpb25TdHJpbmdzIGZyb20gJy4vUHJvamVjdGlsZU1vdGlvblN0cmluZ3MuanMnO1xyXG5pbXBvcnQgVmVjdG9yc1NjcmVlbiBmcm9tICcuL3ZlY3RvcnMvVmVjdG9yc1NjcmVlbi5qcyc7XHJcblxyXG5jb25zdCBwcm9qZWN0aWxlTW90aW9uVGl0bGVTdHJpbmcgPVxyXG4gIFByb2plY3RpbGVNb3Rpb25TdHJpbmdzWyAncHJvamVjdGlsZS1tb3Rpb24nIF0udGl0bGVTdHJpbmdQcm9wZXJ0eTtcclxuXHJcbmNvbnN0IHNpbU9wdGlvbnMgPSB7XHJcbiAgY3JlZGl0czoge1xyXG4gICAgbGVhZERlc2lnbjogJ0FteSBSb3VpbmZhciwgTWlrZSBEdWJzb24nLFxyXG4gICAgc29mdHdhcmVEZXZlbG9wbWVudDogJ0FuZHJlYSBMaW4sIE1hdHRoZXcgQmxhY2ttYW4nLFxyXG4gICAgdGVhbTogJ0FyaWVsIFBhdWwsIEthdGh5IFBlcmtpbnMsIEFtYW5kYSBNY0dhcnJ5LCBXZW5keSBBZGFtcywgSm9obiBCbGFuY28nLFxyXG4gICAgcXVhbGl0eUFzc3VyYW5jZTogJ1N0ZWVsZSBEYWx0b24sIEFsZXggRG9ybmFuLCBFdGhhbiBKb2huc29uLCBMaWFtIE11bGhhbGwnLFxyXG4gICAgZ3JhcGhpY0FydHM6ICdNYXJpYWggSGVybXNtZXllciwgQ2hlcnlsIE1jQ3V0Y2hhbidcclxuICB9XHJcbn07XHJcblxyXG5zaW1MYXVuY2hlci5sYXVuY2goICgpID0+IHtcclxuICBjb25zdCBzaW0gPSBuZXcgU2ltKFxyXG4gICAgcHJvamVjdGlsZU1vdGlvblRpdGxlU3RyaW5nLFxyXG4gICAgW1xyXG4gICAgICBuZXcgSW50cm9TY3JlZW4oIFRhbmRlbS5ST09ULmNyZWF0ZVRhbmRlbSggJ2ludHJvU2NyZWVuJyApICksXHJcbiAgICAgIG5ldyBWZWN0b3JzU2NyZWVuKCBUYW5kZW0uUk9PVC5jcmVhdGVUYW5kZW0oICd2ZWN0b3JzU2NyZWVuJyApICksXHJcbiAgICAgIG5ldyBEcmFnU2NyZWVuKCBUYW5kZW0uUk9PVC5jcmVhdGVUYW5kZW0oICdkcmFnU2NyZWVuJyApICksXHJcbiAgICAgIG5ldyBMYWJTY3JlZW4oIFRhbmRlbS5ST09ULmNyZWF0ZVRhbmRlbSggJ2xhYlNjcmVlbicgKSApXHJcbiAgICBdLFxyXG4gICAgc2ltT3B0aW9uc1xyXG4gICk7XHJcbiAgc2ltLnN0YXJ0KCk7XHJcbn0gKTsiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsT0FBT0EsR0FBRyxNQUFNLHVCQUF1QjtBQUN2QyxPQUFPQyxXQUFXLE1BQU0sK0JBQStCO0FBQ3ZELE9BQU9DLE1BQU0sTUFBTSwyQkFBMkI7QUFDOUMsT0FBT0MsVUFBVSxNQUFNLHNCQUFzQjtBQUM3QyxPQUFPQyxXQUFXLE1BQU0sd0JBQXdCO0FBQ2hELE9BQU9DLFNBQVMsTUFBTSxvQkFBb0I7QUFDMUMsT0FBT0MsdUJBQXVCLE1BQU0sOEJBQThCO0FBQ2xFLE9BQU9DLGFBQWEsTUFBTSw0QkFBNEI7QUFFdEQsTUFBTUMsMkJBQTJCLEdBQy9CRix1QkFBdUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDRyxtQkFBbUI7QUFFcEUsTUFBTUMsVUFBVSxHQUFHO0VBQ2pCQyxPQUFPLEVBQUU7SUFDUEMsVUFBVSxFQUFFLDJCQUEyQjtJQUN2Q0MsbUJBQW1CLEVBQUUsOEJBQThCO0lBQ25EQyxJQUFJLEVBQUUscUVBQXFFO0lBQzNFQyxnQkFBZ0IsRUFBRSx5REFBeUQ7SUFDM0VDLFdBQVcsRUFBRTtFQUNmO0FBQ0YsQ0FBQztBQUVEZixXQUFXLENBQUNnQixNQUFNLENBQUUsTUFBTTtFQUN4QixNQUFNQyxHQUFHLEdBQUcsSUFBSWxCLEdBQUcsQ0FDakJRLDJCQUEyQixFQUMzQixDQUNFLElBQUlKLFdBQVcsQ0FBRUYsTUFBTSxDQUFDaUIsSUFBSSxDQUFDQyxZQUFZLENBQUUsYUFBYyxDQUFFLENBQUMsRUFDNUQsSUFBSWIsYUFBYSxDQUFFTCxNQUFNLENBQUNpQixJQUFJLENBQUNDLFlBQVksQ0FBRSxlQUFnQixDQUFFLENBQUMsRUFDaEUsSUFBSWpCLFVBQVUsQ0FBRUQsTUFBTSxDQUFDaUIsSUFBSSxDQUFDQyxZQUFZLENBQUUsWUFBYSxDQUFFLENBQUMsRUFDMUQsSUFBSWYsU0FBUyxDQUFFSCxNQUFNLENBQUNpQixJQUFJLENBQUNDLFlBQVksQ0FBRSxXQUFZLENBQUUsQ0FBQyxDQUN6RCxFQUNEVixVQUNGLENBQUM7RUFDRFEsR0FBRyxDQUFDRyxLQUFLLENBQUMsQ0FBQztBQUNiLENBQUUsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==