import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'mentionHighlight'
})
export class MentionHighlightPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }
    const transformedHtml = value.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(transformedHtml);
  }
}