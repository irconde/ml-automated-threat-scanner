import { MinioBucket, MinioFile } from './minio-xml-parser.types';

export class MinioXMLParser {
  public static parseGetBucketName(xmlString: string): MinioFile[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const contents = xmlDoc.getElementsByTagName('Contents');
    const files: MinioFile[] = [];

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      const key = content.getElementsByTagName('Key')[0].textContent;
      const parsedSize = content.getElementsByTagName('Size')[0].textContent;
      const size = parseInt(parsedSize!);
      const parsedLastModified =
        content.getElementsByTagName('LastModified')[0].textContent;
      const lastModified = new Date(parsedLastModified!);

      files.push({
        name: key!.split('/').pop()!, // Get the file name from path
        size: size,
        lastModified: lastModified,
      });
    }

    return files;
  }

  public static parseBuckets(xmlString: string): MinioBucket[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    const bucketsNode = xmlDoc.getElementsByTagName('Buckets')[0];
    const bucketsList = bucketsNode.getElementsByTagName('Bucket');
    const buckets: MinioBucket[] = [];

    for (let i = 0; i < bucketsList.length; i++) {
      const bucketNode = bucketsList[i];
      const name = bucketNode.getElementsByTagName('Name')[0].textContent;
      const creationDateString =
        bucketNode.getElementsByTagName('CreationDate')[0].textContent;
      const creationDate = new Date(creationDateString!);

      buckets.push({
        name: name!,
        creationDate: creationDate,
      });
    }

    return buckets;
  }
}
