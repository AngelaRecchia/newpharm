import classNames from 'classnames/bind'
import styles from './index.module.scss'
import { ProductStoryblok } from '@/types/storyblok'

const cn = classNames.bind(styles)

const Product = ({ blok }: { blok: ProductStoryblok }) => {

  const { title, secondary_title, image, short_description, features, product_type, category, tab_filtri, application_areas, application_areas_sub, target_pests, target_pests_sub, tab_dettaglio, application_areas_text, composition, dosage_and_application, units_per_carton, registration, safety_data_sheet, tab_media, video, related_products } = blok
  return (
    <div className={cn('wrapper')}>

      <div className={cn('container')}></div>
    </div>
  )
}

export default Product
