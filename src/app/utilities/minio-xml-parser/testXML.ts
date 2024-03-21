import { MinioXMLParser } from './minio-xml-parser.utilities';

// TODO: Remove this file after testing
export function testXML() {
  const getBucketName =
    MinioXMLParser.parseGetBucketName(`<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <Name>intelliscan-shared-storage</Name>
    <Prefix></Prefix>
    <Marker></Marker>
    <MaxKeys>1000</MaxKeys>
    <IsTruncated>false</IsTruncated>
    <Contents>
        <Key>ora/1_img.ora</Key>
        <LastModified>2024-02-19T21:58:16.318Z</LastModified>
        <ETag>&#34;258665ce2925b8d71066f29054172019&#34;</ETag>
        <Size>1622352</Size>
        <Owner>
            <ID>02d6176db174dc93cb1b899f7c6078f08654445fe8cf1b6ce98d8855f66bdbf4</ID>
            <DisplayName>minio</DisplayName>
        </Owner>
        <StorageClass>STANDARD</StorageClass>
    </Contents>
    <Contents>
        <Key>ora/2_img.ora</Key>
        <LastModified>2024-02-19T21:45:43.511Z</LastModified>
        <ETag>&#34;cf2136f5e678f823ef4f90aa1575dfb5&#34;</ETag>
        <Size>2143951</Size>
        <Owner>
            <ID>02d6176db174dc93cb1b899f7c6078f08654445fe8cf1b6ce98d8855f66bdbf4</ID>
            <DisplayName>minio</DisplayName>
        </Owner>
        <StorageClass>STANDARD</StorageClass>
    </Contents>
    <Contents>
        <Key>ora/3_img.ora</Key>
        <LastModified>2024-03-05T00:37:09.446Z</LastModified>
        <ETag>&#34;f8c1a84a59dd1b096a4dd83c2d180b46&#34;</ETag>
        <Size>2142450</Size>
        <Owner>
            <ID>02d6176db174dc93cb1b899f7c6078f08654445fe8cf1b6ce98d8855f66bdbf4</ID>
            <DisplayName>minio</DisplayName>
        </Owner>
        <StorageClass>STANDARD</StorageClass>
    </Contents>
</ListBucketResult>`);
  const buckets =
    MinioXMLParser.parseBuckets(`<?xml version="1.0" encoding="UTF-8"?>
<ListAllMyBucketsResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <Owner>
        <ID>02d6176db174dc93cb1b899f7c6078f08654445fe8cf1b6ce98d8855f66bdbf4</ID>
        <DisplayName>minio</DisplayName>
    </Owner>
    <Buckets>
        <Bucket>
            <Name>intelliscan-shared-storage</Name>
            <CreationDate>2024-01-25T20:19:56.247Z</CreationDate>
        </Bucket>
        <Bucket>
            <Name>main</Name>
            <CreationDate>2023-11-21T00:05:41.245Z</CreationDate>
        </Bucket>
    </Buckets>
</ListAllMyBucketsResult>`);

  console.log('getBucketName', getBucketName);
  console.log('buckets', buckets);
}
