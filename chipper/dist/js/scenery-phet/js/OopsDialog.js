// Copyright 2019-2023, University of Colorado Boulder

/**
 * OopsDialog is displayed when some limitation of the simulation is encountered.
 * So named because the messages typically begin with 'Oops!', so that's how people referred to it.
 * See https://github.com/phetsims/equality-explorer/issues/48
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import optionize from '../../phet-core/js/optionize.js';
import { HBox, Image, RichText } from '../../scenery/js/imports.js';
import Dialog from '../../sun/js/Dialog.js';
import IOType from '../../tandem/js/types/IOType.js';
import phetGirlWaggingFinger_png from '../images/phetGirlWaggingFinger_png.js';
import PhetFont from './PhetFont.js';
import sceneryPhet from './sceneryPhet.js';
export default class OopsDialog extends Dialog {
  /**
   * @param messageString - supports RichText formatting
   * @param [providedOptions]
   */
  constructor(messageString, providedOptions) {
    const options = optionize()({
      // DialogOptions
      topMargin: 20,
      bottomMargin: 20,
      // phet-io
      phetioType: OopsDialog.OopsDialogIO
    }, providedOptions);
    const text = new RichText(messageString, optionize()({
      font: new PhetFont(20),
      maxWidth: 600,
      maxHeight: 400
    }, options.richTextOptions));
    const iconNode = options.iconNode || new Image(phetGirlWaggingFinger_png, {
      maxHeight: 132 // determined empirically
    });
    const content = new HBox({
      spacing: 20,
      children: [text, iconNode]
    });
    super(content, options);
    this.disposeOopsDialog = () => {
      text.dispose();
    };
    if (typeof messageString !== 'string') {
      this.addLinkedElement(messageString);
    }
  }
  dispose() {
    this.disposeOopsDialog();
    super.dispose();
  }
  static OopsDialogIO = new IOType('OopsDialogIO', {
    valueType: OopsDialog,
    supertype: Dialog.DialogIO
  });
}
sceneryPhet.register('OopsDialog', OopsDialog);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJvcHRpb25pemUiLCJIQm94IiwiSW1hZ2UiLCJSaWNoVGV4dCIsIkRpYWxvZyIsIklPVHlwZSIsInBoZXRHaXJsV2FnZ2luZ0Zpbmdlcl9wbmciLCJQaGV0Rm9udCIsInNjZW5lcnlQaGV0IiwiT29wc0RpYWxvZyIsImNvbnN0cnVjdG9yIiwibWVzc2FnZVN0cmluZyIsInByb3ZpZGVkT3B0aW9ucyIsIm9wdGlvbnMiLCJ0b3BNYXJnaW4iLCJib3R0b21NYXJnaW4iLCJwaGV0aW9UeXBlIiwiT29wc0RpYWxvZ0lPIiwidGV4dCIsImZvbnQiLCJtYXhXaWR0aCIsIm1heEhlaWdodCIsInJpY2hUZXh0T3B0aW9ucyIsImljb25Ob2RlIiwiY29udGVudCIsInNwYWNpbmciLCJjaGlsZHJlbiIsImRpc3Bvc2VPb3BzRGlhbG9nIiwiZGlzcG9zZSIsImFkZExpbmtlZEVsZW1lbnQiLCJ2YWx1ZVR5cGUiLCJzdXBlcnR5cGUiLCJEaWFsb2dJTyIsInJlZ2lzdGVyIl0sInNvdXJjZXMiOlsiT29wc0RpYWxvZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOS0yMDIzLCBVbml2ZXJzaXR5IG9mIENvbG9yYWRvIEJvdWxkZXJcclxuXHJcbi8qKlxyXG4gKiBPb3BzRGlhbG9nIGlzIGRpc3BsYXllZCB3aGVuIHNvbWUgbGltaXRhdGlvbiBvZiB0aGUgc2ltdWxhdGlvbiBpcyBlbmNvdW50ZXJlZC5cclxuICogU28gbmFtZWQgYmVjYXVzZSB0aGUgbWVzc2FnZXMgdHlwaWNhbGx5IGJlZ2luIHdpdGggJ09vcHMhJywgc28gdGhhdCdzIGhvdyBwZW9wbGUgcmVmZXJyZWQgdG8gaXQuXHJcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vcGhldHNpbXMvZXF1YWxpdHktZXhwbG9yZXIvaXNzdWVzLzQ4XHJcbiAqXHJcbiAqIEBhdXRob3IgQ2hyaXMgTWFsbGV5IChQaXhlbFpvb20sIEluYy4pXHJcbiAqL1xyXG5cclxuaW1wb3J0IG9wdGlvbml6ZSwgeyBFbXB0eVNlbGZPcHRpb25zIH0gZnJvbSAnLi4vLi4vcGhldC1jb3JlL2pzL29wdGlvbml6ZS5qcyc7XHJcbmltcG9ydCBTdHJpY3RPbWl0IGZyb20gJy4uLy4uL3BoZXQtY29yZS9qcy90eXBlcy9TdHJpY3RPbWl0LmpzJztcclxuaW1wb3J0IHsgSEJveCwgSW1hZ2UsIE5vZGUsIFJpY2hUZXh0LCBSaWNoVGV4dE9wdGlvbnMgfSBmcm9tICcuLi8uLi9zY2VuZXJ5L2pzL2ltcG9ydHMuanMnO1xyXG5pbXBvcnQgRGlhbG9nLCB7IERpYWxvZ09wdGlvbnMgfSBmcm9tICcuLi8uLi9zdW4vanMvRGlhbG9nLmpzJztcclxuaW1wb3J0IElPVHlwZSBmcm9tICcuLi8uLi90YW5kZW0vanMvdHlwZXMvSU9UeXBlLmpzJztcclxuaW1wb3J0IHBoZXRHaXJsV2FnZ2luZ0Zpbmdlcl9wbmcgZnJvbSAnLi4vaW1hZ2VzL3BoZXRHaXJsV2FnZ2luZ0Zpbmdlcl9wbmcuanMnO1xyXG5pbXBvcnQgUGhldEZvbnQgZnJvbSAnLi9QaGV0Rm9udC5qcyc7XHJcbmltcG9ydCBzY2VuZXJ5UGhldCBmcm9tICcuL3NjZW5lcnlQaGV0LmpzJztcclxuaW1wb3J0IFJlYWRPbmx5UHJvcGVydHkgZnJvbSAnLi4vLi4vYXhvbi9qcy9SZWFkT25seVByb3BlcnR5LmpzJztcclxuXHJcbnR5cGUgU2VsZk9wdGlvbnMgPSB7XHJcblxyXG4gIC8vIE9wdGlvbmFsIGljb24gdGhhdCB3aWxsIGJlIHBsYWNlZCB0byB0aGUgcmlnaHQgb2YgdGhlIGltYWdlLlxyXG4gIC8vIElmIG5vdCBwcm92aWRlZCwgdGhlbiBhIFBoRVQgR2lybCBpbWFnZSBpcyB1c2VkLlxyXG4gIC8vIElmIHByb3ZpZGVkLCB0aGUgY2FsbGVyIGlzIHJlc3BvbnNpYmxlIGZvciBhbGwgYXNwZWN0cyBvZiB0aGUgaWNvbiwgaW5jbHVkaW5nIHNjYWxlLlxyXG4gIGljb25Ob2RlPzogTm9kZTtcclxuXHJcbiAgLy8gUGFzc2VkIHRvIFJpY2hUZXh0IG5vZGUgdGhhdCBkaXNwbGF5cyBtZXNzYWdlU3RyaW5nXHJcbiAgcmljaFRleHRPcHRpb25zPzogUmljaFRleHRPcHRpb25zO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgT29wc0RpYWxvZ09wdGlvbnMgPSBTZWxmT3B0aW9ucyAmIERpYWxvZ09wdGlvbnM7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPb3BzRGlhbG9nIGV4dGVuZHMgRGlhbG9nIHtcclxuXHJcbiAgcHJpdmF0ZSByZWFkb25seSBkaXNwb3NlT29wc0RpYWxvZzogKCkgPT4gdm9pZDtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIG1lc3NhZ2VTdHJpbmcgLSBzdXBwb3J0cyBSaWNoVGV4dCBmb3JtYXR0aW5nXHJcbiAgICogQHBhcmFtIFtwcm92aWRlZE9wdGlvbnNdXHJcbiAgICovXHJcbiAgcHVibGljIGNvbnN0cnVjdG9yKCBtZXNzYWdlU3RyaW5nOiBzdHJpbmcgfCBSZWFkT25seVByb3BlcnR5PHN0cmluZz4sIHByb3ZpZGVkT3B0aW9ucz86IE9vcHNEaWFsb2dPcHRpb25zICkge1xyXG5cclxuICAgIGNvbnN0IG9wdGlvbnMgPSBvcHRpb25pemU8T29wc0RpYWxvZ09wdGlvbnMsIFN0cmljdE9taXQ8U2VsZk9wdGlvbnMsICdpY29uTm9kZScgfCAncmljaFRleHRPcHRpb25zJz4sIERpYWxvZ09wdGlvbnM+KCkoIHtcclxuXHJcbiAgICAgIC8vIERpYWxvZ09wdGlvbnNcclxuICAgICAgdG9wTWFyZ2luOiAyMCxcclxuICAgICAgYm90dG9tTWFyZ2luOiAyMCxcclxuXHJcbiAgICAgIC8vIHBoZXQtaW9cclxuICAgICAgcGhldGlvVHlwZTogT29wc0RpYWxvZy5Pb3BzRGlhbG9nSU9cclxuICAgIH0sIHByb3ZpZGVkT3B0aW9ucyApO1xyXG5cclxuICAgIGNvbnN0IHRleHQgPSBuZXcgUmljaFRleHQoIG1lc3NhZ2VTdHJpbmcsIG9wdGlvbml6ZTxSaWNoVGV4dE9wdGlvbnMsIEVtcHR5U2VsZk9wdGlvbnMsIFJpY2hUZXh0T3B0aW9ucz4oKSgge1xyXG4gICAgICBmb250OiBuZXcgUGhldEZvbnQoIDIwICksXHJcbiAgICAgIG1heFdpZHRoOiA2MDAsXHJcbiAgICAgIG1heEhlaWdodDogNDAwXHJcbiAgICB9LCBvcHRpb25zLnJpY2hUZXh0T3B0aW9ucyApICk7XHJcblxyXG4gICAgY29uc3QgaWNvbk5vZGUgPSBvcHRpb25zLmljb25Ob2RlIHx8IG5ldyBJbWFnZSggcGhldEdpcmxXYWdnaW5nRmluZ2VyX3BuZywge1xyXG4gICAgICBtYXhIZWlnaHQ6IDEzMiAvLyBkZXRlcm1pbmVkIGVtcGlyaWNhbGx5XHJcbiAgICB9ICk7XHJcblxyXG4gICAgY29uc3QgY29udGVudCA9IG5ldyBIQm94KCB7XHJcbiAgICAgIHNwYWNpbmc6IDIwLFxyXG4gICAgICBjaGlsZHJlbjogWyB0ZXh0LCBpY29uTm9kZSBdXHJcbiAgICB9ICk7XHJcblxyXG4gICAgc3VwZXIoIGNvbnRlbnQsIG9wdGlvbnMgKTtcclxuXHJcbiAgICB0aGlzLmRpc3Bvc2VPb3BzRGlhbG9nID0gKCkgPT4ge1xyXG4gICAgICB0ZXh0LmRpc3Bvc2UoKTtcclxuICAgIH07XHJcblxyXG4gICAgaWYgKCB0eXBlb2YgbWVzc2FnZVN0cmluZyAhPT0gJ3N0cmluZycgKSB7XHJcbiAgICAgIHRoaXMuYWRkTGlua2VkRWxlbWVudCggbWVzc2FnZVN0cmluZyApO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIG92ZXJyaWRlIGRpc3Bvc2UoKTogdm9pZCB7XHJcbiAgICB0aGlzLmRpc3Bvc2VPb3BzRGlhbG9nKCk7XHJcbiAgICBzdXBlci5kaXNwb3NlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IE9vcHNEaWFsb2dJTyA9IG5ldyBJT1R5cGUoICdPb3BzRGlhbG9nSU8nLCB7XHJcbiAgICB2YWx1ZVR5cGU6IE9vcHNEaWFsb2csXHJcbiAgICBzdXBlcnR5cGU6IERpYWxvZy5EaWFsb2dJT1xyXG4gIH0gKTtcclxufVxyXG5c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